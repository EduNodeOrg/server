const StellarSdk = require('@stellar/stellar-sdk');

// Configuration - CORRECT URLs for Stellar Testnet
const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";  // For smart contracts
const HORIZON_URL = "https://horizon-testnet.stellar.org";       // For account operations
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
const DIPLOMA_NFT_CONTRACT = "CBTGYCVE27SUBICFXLTR53IELNCHYRPDSH3DRGRW6VNETMTOFILRB535";

// Destructure commonly used StellarSdk methods
const {
    TransactionBuilder,
    Networks,
    Operation,
    Asset,
    Keypair,
    Address,
    Contract,
    nativeToScVal,
    scValToNative,
    xdr,
    SorobanRpc
} = StellarSdk;

class DiplomaNFTInteraction {
    constructor(contractId, sorobanRpcUrl = SOROBAN_RPC_URL, networkPassphrase = NETWORK_PASSPHRASE) {
        this.contractId = contractId;
        this.contract = new Contract(contractId);
        this.sorobanServer = new StellarSdk.rpc.Server(SOROBAN_RPC_URL);
        this.horizonServer = new StellarSdk.Horizon.Server(HORIZON_URL);
        this.networkPassphrase = networkPassphrase;
    }

    /**
     * Helper method to simulate a contract call
     * @param {string} method - Contract method name
     * @param {Array} args - Method arguments
     * @param {string} sourceAccount - Source account public key
     * @returns {Promise<any>} - Simulation result
     */
    async simulateCall(method, args = [], sourceAccount = null) {
        try {
            // Use a dummy account for simulation if none provided
            const source = sourceAccount || "GAFM5WGCXC7JU6GP5LBN5BESRT3W6JGCK7OMLK54EYCQK4BQJGBTBU2F";
            
            // Get source account details from Horizon
            let sourceAccountObj;
            try {
                sourceAccountObj = await this.horizonServer.loadAccount(source);
            } catch (error) {
                // Create a dummy account object if account doesn't exist
                sourceAccountObj = {
                    sequenceNumber: () => "0",
                    accountId: () => source,
                    sequence: "0"
                };
            }

            // Build the transaction with the contract call
            const transaction = new TransactionBuilder(sourceAccountObj, {
                fee: StellarSdk.BASE_FEE,
                networkPassphrase: this.networkPassphrase,
            })
            .addOperation(this.contract.call(method, ...args))
            .setTimeout(30)
            .build();

            // Simulate the transaction using Soroban RPC
            const simulation = await this.sorobanServer.simulateTransaction(transaction);
            
            if (simulation.error) {
                throw new Error(`Simulation failed: ${simulation.error}`);
            }

            if (simulation.result?.retval) {
                return scValToNative(simulation.result.retval);
            }

            return simulation;
        } catch (error) {
            console.error(`Error simulating ${method}:`, error.message);
            throw error;
        }
    }

    /**
     * Helper method to build and submit a transaction
     * @param {string} method - Contract method name
     * @param {Array} args - Method arguments
     * @param {Keypair} sourceKeypair - Source keypair for signing
     * @returns {Promise<any>} - Transaction result
     */
    async submitTransaction(method, args, sourceKeypair) {
        try {
            // Get source account from Horizon
            const sourceAccount = await this.horizonServer.loadAccount(sourceKeypair.publicKey());
            
            // Build the transaction
            let transaction = new TransactionBuilder(sourceAccount, {
                fee: "100000",
                networkPassphrase: this.networkPassphrase,
            })
            .addOperation(this.contract.call(method, ...args))
            .setTimeout(30)
            .build();

            console.log('Simulating transaction...');
            const simulation = await this.sorobanServer.simulateTransaction(transaction);
            
            if (simulation.error) {
                console.error('Simulation error:', simulation.error);
                throw new Error(`Simulation failed: ${JSON.stringify(simulation.error, null, 2)}`);
            }

            console.log('Simulation successful, preparing transaction...');
            
            // Prepare the transaction with simulation results
            const preparedTransaction = SorobanRpc.assembleTransaction(
                transaction,
                simulation
            );

            // Sign the transaction
            console.log('Signing transaction...');
            preparedTransaction.sign(sourceKeypair);

            // Submit the transaction
            console.log('Submitting transaction...');
            const response = await this.sorobanServer.sendTransaction(preparedTransaction);
            
            console.log('Transaction submitted, response:', response);
            
            if (response.status === 'ERROR') {
                let errorDetails = 'Unknown error';
                try {
                    errorDetails = JSON.stringify(response, null, 2);
                } catch (e) {
                    errorDetails = String(response);
                }
                throw new Error(`Transaction submission failed: ${errorDetails}`);
            }

            // Wait for confirmation
            console.log('Waiting for transaction confirmation...');
            let getResponse = await this.sorobanServer.getTransaction(response.hash);
            
            while (getResponse.status === 'NOT_FOUND') {
                await new Promise(resolve => setTimeout(resolve, 1000));
                getResponse = await this.sorobanServer.getTransaction(response.hash);
            }

            console.log('Transaction status:', getResponse.status);
            
            if (getResponse.status === 'SUCCESS') {
                return getResponse;
            } else {
                let errorDetails = 'Unknown error';
                try {
                    errorDetails = JSON.stringify(getResponse, null, 2);
                } catch (e) {
                    errorDetails = String(getResponse);
                }
                throw new Error(`Transaction failed with status ${getResponse.status}: ${errorDetails}`);
            }

        } catch (error) {
            console.error(`Error in submitTransaction (${method}):`, error);
            throw error;
        }
    }

    /**
     * Initialize the diploma NFT contract
     * @param {Keypair} adminKeypair - The admin keypair
     * @param {string} name - Collection name
     * @param {string} symbol - Collection symbol
     * @returns {Promise<any>} - Transaction result
     */
    async initializeContract(adminKeypair, name, symbol) {
        const args = [
            new Address(adminKeypair.publicKey()).toScVal(),
            nativeToScVal(name, { type: "string" }),
            nativeToScVal(symbol, { type: "string" })
        ];

        return await this.submitTransaction("initialize", args, adminKeypair);
    }

    /**
     * Mint a new diploma NFT
     * @param {Keypair} adminKeypair - The admin keypair
     * @param {string} to - Recipient address
     * @param {number} tokenId - Token ID
     * @returns {Promise<any>} - Transaction result
     */
    async mintDiploma(adminKeypair, to, tokenId, metadata = {}) {
        try {
            console.log(`Minting NFT for recipient: ${to} with tokenId: ${tokenId}`);
            
            // Validate inputs
            if (!DiplomaUtils.isValidAddress(to)) {
                throw new Error('Invalid recipient address. Must be a valid Stellar public key starting with "G"');
            }
            
            if (!tokenId || typeof tokenId !== 'number' || tokenId < 0) {
                throw new Error('Invalid token ID. Must be a positive number');
            }
            
            // Convert parameters to SCVal
            const toScVal = new Address(to).toScVal();
            const tokenIdScVal = nativeToScVal(tokenId, { type: "u64" });
            
            console.log('Calling mint with parameters:');
            console.log('- Recipient address:', to);
            console.log('- Token ID:', tokenId);
            console.log('- Metadata:', metadata);
            
            // Try different parameter combinations based on common Soroban NFT patterns
            let args;
            
            if (metadata && Object.keys(metadata).length > 0) {
                // Option 1: mint(to, token_id, uri)
                const uri = metadata.uri || "";
                const uriScVal = nativeToScVal(uri, { type: "string" });
                args = [toScVal, tokenIdScVal, uriScVal];
                
                console.log('Trying mint with URI parameter');
            } else {
                // Option 2: mint(to, token_id) - your current approach
                args = [toScVal, tokenIdScVal];
                console.log('Trying basic mint with 2 parameters');
            }
            
            try {
                return await this.submitTransaction("mint", args, adminKeypair);
            } catch (error) {
                if (error.message.includes('MismatchingParameterLen')) {
                    console.log('Trying alternative parameter combinations...');
                    
                    // Option 3: mint(admin, to, token_id) - some contracts require admin as first param
                    const adminScVal = new Address(adminKeypair.publicKey()).toScVal();
                    args = [adminScVal, toScVal, tokenIdScVal];
                    
                    console.log('Trying mint with admin as first parameter');
                    try {
                        return await this.submitTransaction("mint", args, adminKeypair);
                    } catch (error2) {
                        if (error2.message.includes('MismatchingParameterLen')) {
                            // Option 4: mint(to, token_id, name, symbol) - full metadata
                            const name = metadata.name || "Diploma NFT";
                            const symbol = metadata.symbol || "DIPLOMA";
                            const nameScVal = nativeToScVal(name, { type: "string" });
                            const symbolScVal = nativeToScVal(symbol, { type: "string" });
                            
                            args = [toScVal, tokenIdScVal, nameScVal, symbolScVal];
                            console.log('Trying mint with name and symbol parameters');
                            
                            return await this.submitTransaction("mint", args, adminKeypair);
                        } else {
                            throw error2;
                        }
                    }
                } else {
                    throw error;
                }
            }
            
        } catch (error) {
            console.error('Error in mintDiploma:', error);
            throw error;
        }
    }

    /**
     * Get the owner of a specific token
     * @param {number} tokenId - Token ID to query
     * @returns {Promise<string>} - Owner address
     */
    async getOwnerOf(tokenId) {
        const args = [nativeToScVal(tokenId, { type: "u64" })];
        return await this.simulateCall("owner_of", args);
    }

    /**
     * Get diploma details for a specific token
     * @param {number} tokenId - Token ID to query
     * @returns {Promise<Object>} - Diploma details
     */
    async getDiplomaDetails(tokenId) {
        const args = [nativeToScVal(tokenId, { type: "u64" })];
        return await this.simulateCall("get_diploma_details", args);
    }

    /**
     * Get the balance of tokens owned by an address
     * @param {string} owner - Owner address
     * @returns {Promise<number>} - Number of tokens owned
     */
    async getBalance(owner) {
        const args = [new Address(owner).toScVal()];
        return await this.simulateCall("balance_of", args);
    }

    /**
     * Get total supply of tokens
     * @returns {Promise<number>} - Total supply
     */
    async getTotalSupply() {
        return await this.simulateCall("total_supply", []);
    }

    /**
     * Get contract name
     * @returns {Promise<string>} - Contract name
     */
    async getName() {
        return await this.simulateCall("name", []);
    }

    /**
     * Get contract symbol
     * @returns {Promise<string>} - Contract symbol
     */
    async getSymbol() {
        return await this.simulateCall("symbol", []);
    }

    /**
     * Transfer a token from one address to another
     * @param {Keypair} fromKeypair - The sender's keypair
     * @param {string} to - Recipient address
     * @param {number} tokenId - Token ID to transfer
     * @returns {Promise<any>} - Transaction result
     */
    async transfer(fromKeypair, to, tokenId) {
        const args = [
            new Address(fromKeypair.publicKey()).toScVal(),
            new Address(to).toScVal(),
            nativeToScVal(tokenId, { type: "u64" })
        ];

        return await this.submitTransaction("transfer_from", args, fromKeypair);
    }

    /**
     * Approve another address to transfer a specific token
     * @param {Keypair} ownerKeypair - The owner's keypair
     * @param {string} approved - Address to approve
     * @param {number} tokenId - Token ID to approve
     * @returns {Promise<any>} - Transaction result
     */
    async approve(ownerKeypair, approved, tokenId) {
        const args = [
            new Address(approved).toScVal(),
            nativeToScVal(tokenId, { type: "u64" })
        ];

        return await this.submitTransaction("approve", args, ownerKeypair);
    }

    /**
     * Get the approved address for a specific token
     * @param {number} tokenId - Token ID to query
     * @returns {Promise<string>} - Approved address
     */
    async getApproved(tokenId) {
        const args = [nativeToScVal(tokenId, { type: "u64" })];
        return await this.simulateCall("get_approved", args);
    }

    /**
     * Check if an operator is approved for all tokens of an owner
     * @param {string} owner - Owner address
     * @param {string} operator - Operator address
     * @returns {Promise<boolean>} - True if approved for all
     */
    async isApprovedForAll(owner, operator) {
        const args = [
            new Address(owner).toScVal(),
            new Address(operator).toScVal()
        ];
        return await this.simulateCall("is_approved_for_all", args);
    }

    /**
     * Set approval for all tokens
     * @param {Keypair} ownerKeypair - The owner's keypair
     * @param {string} operator - Operator address
     * @param {boolean} approved - Approval status
     * @returns {Promise<any>} - Transaction result
     */
    async setApprovalForAll(ownerKeypair, operator, approved) {
        const args = [
            new Address(operator).toScVal(),
            nativeToScVal(approved, { type: "bool" })
        ];

        return await this.submitTransaction("set_approval_for_all", args, ownerKeypair);
    }

    /**
     * Get token by index
     * @param {number} index - Token index
     * @returns {Promise<number>} - Token ID
     */
    async tokenByIndex(index) {
        const args = [nativeToScVal(index, { type: "u64" })];
        return await this.simulateCall("token_by_index", args);
    }

    /**
     * Get token of owner by index
     * @param {string} owner - Owner address
     * @param {number} index - Token index for this owner
     * @returns {Promise<number>} - Token ID
     */
    async tokenOfOwnerByIndex(owner, index) {
        const args = [
            new Address(owner).toScVal(),
            nativeToScVal(index, { type: "u64" })
        ];
        return await this.simulateCall("token_of_owner_by_index", args);
    }

    /**
     * Verify a diploma by checking its hash
     * @param {number} tokenId - Token ID to verify
     * @param {string} expectedHash - Expected diploma hash
     * @returns {Promise<boolean>} - True if diploma is valid
     */
    async verifyDiploma(tokenId, expectedHash) {
        try {
            const diplomaDetails = await this.getDiplomaDetails(tokenId);
            // Assuming the diploma details include the hash
            return diplomaDetails.diploma_hash === expectedHash;
        } catch (error) {
            console.error("Error verifying diploma:", error);
            return false;
        }
    }

    /**
     * Get contract metadata
     * @returns {Promise<Object>} - Contract metadata
     */
    async getContractInfo() {
        try {
            const [name, symbol, totalSupply] = await Promise.all([
                this.getName(),
                this.getSymbol(),
                this.getTotalSupply()
            ]);

            return {
                name,
                symbol,
                totalSupply,
                contractId: this.contractId
            };
        } catch (error) {
            console.error("Error getting contract info:", error);
            throw error;
        }
    }

    /**
     * Check if contract is deployed and initialized
     * @returns {Promise<boolean>} - True if contract exists and is initialized
     */
    async isContractInitialized() {
        try {
            await this.getName();
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Utility functions
class DiplomaUtils {
    /**
     * Generate a keypair from secret key
     * @param {string} secretKey - Secret key string
     * @returns {Keypair} - Keypair object
     */
    static keypairFromSecret(secretKey) {
        return Keypair.fromSecret(secretKey);
    }

    /**
     * Generate a random keypair
     * @returns {Keypair} - Random keypair
     */
    static generateKeypair() {
        return Keypair.random();
    }

    /**
     * Create a hash for diploma document
     * @param {Object} diplomaData - Diploma data object
     * @returns {string} - Hash string
     */
    static createDiplomaHash(diplomaData) {
        const crypto = require('crypto');
        const dataString = JSON.stringify(diplomaData, Object.keys(diplomaData).sort());
        return crypto.createHash('sha256').update(dataString).digest('hex');
    }

    /**
     * Format token ID for display
     * @param {number} tokenId - Token ID
     * @returns {string} - Formatted token ID
     */
    static formatTokenId(tokenId) {
        return `#${tokenId.toString().padStart(4, '0')}`;
    }

    /**
     * Validate Stellar address
     * @param {string} address - Address to validate
     * @returns {boolean} - True if valid
     */
    static isValidAddress(address) {
        try {
            Keypair.fromPublicKey(address);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Format address for display
     * @param {string} address - Full address
     * @param {number} prefixLength - Length of prefix to show
     * @param {number} suffixLength - Length of suffix to show
     * @returns {string} - Formatted address
     */
    static formatAddress(address, prefixLength = 6, suffixLength = 4) {
        if (address.length <= prefixLength + suffixLength) {
            return address;
        }
        return `${address.substring(0, prefixLength)}...${address.substring(address.length - suffixLength)}`;
    }

    /**
     * Check if string is a valid contract ID
     * @param {string} contractId - Contract ID to validate
     * @returns {boolean} - True if valid
     */
    static isValidContractId(contractId) {
        return contractId && contractId.length === 56 && contractId.startsWith('C');
    }
}

// Example usage and testing
async function main() {
    try {
        console.log("🚀 Starting Diploma NFT Contract Interaction Demo");
        console.log("=".repeat(50));
        
        // Initialize the diploma NFT interaction
        console.log("\n🔌 Connecting to Stellar testnet...");
        console.log(`   Soroban RPC: ${SOROBAN_RPC_URL}`);
        console.log(`   Horizon API: ${HORIZON_URL}`);
        console.log(`   Contract ID: ${DIPLOMA_NFT_CONTRACT}`);
        
        const diplomaNFT = new DiplomaNFTInteraction(DIPLOMA_NFT_CONTRACT);
        
        // Check if contract is initialized
        console.log("\n🔍 Checking if contract is initialized...");
        const isInitialized = await diplomaNFT.isContractInitialized();
        
        if (isInitialized) {
            console.log("✅ Contract is initialized!");
            
            // Get contract info
            console.log("\n📋 Getting contract information...");
            try {
                const contractInfo = await diplomaNFT.getContractInfo();
                console.log("✅ Contract Info:");
                console.log(`   Name: ${contractInfo.name}`);
                console.log(`   Symbol: ${contractInfo.symbol}`);
                console.log(`   Total Supply: ${contractInfo.totalSupply}`);
                console.log(`   Contract ID: ${contractInfo.contractId}`);
            } catch (error) {
                console.log("⚠️  Could not fetch complete contract info:", error.message);
            }
            
        } else {
            console.log("⚠️  Contract is not initialized yet.");
            console.log("   You need to call initializeContract() first.");
        }

        // Test individual functions
        console.log("\n🧪 Testing individual functions...");
        
        try {
            console.log("\n📊 Getting total supply...");
            const totalSupply = await diplomaNFT.getTotalSupply();
            console.log("✅ Total Supply:", totalSupply);
        } catch (error) {
            console.log("⚠️  Could not get total supply:", error.message);
        }

        console.log("\n✨ Demo completed!");
        console.log("\n📚 Next steps:");
        console.log("1. Make sure your contract is deployed on Soroban testnet");
        console.log("2. Fund your admin account with testnet XLM");
        console.log("3. Initialize the contract with initializeContract()");
        console.log("4. Mint diploma NFTs with mintDiploma()");
        
    } catch (error) {
        console.error("❌ Error in demo:", error.message);
        
        if (error.message.includes("ENOTFOUND")) {
            console.error("\n🌐 Network error: Could not connect to the Stellar testnet.");
            console.error("   Please check your internet connection and try again.");
        } else if (error.message.includes("Invalid contract") || error.message.includes("account not found")) {
            console.error(`\n📄 Contract issue with ID: ${DIPLOMA_NFT_CONTRACT}`);
            console.error("   Possible issues:");
            console.error("   - Contract is not deployed on Soroban testnet");
            console.error("   - Contract ID is incorrect");
            console.error("   - Contract is not initialized");
        } else {
            console.error("\n🔧 Full error details:");
            console.error(error);
        }
    }
}

// Example of minting a diploma
async function mintDiplomaExample() {
    // Example: Replace with your actual admin secret key
    const ADMIN_SECRET_KEY = "SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
    const RECIPIENT_ADDRESS = "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
    
    try {
        const diplomaNFT = new DiplomaNFTInteraction(DIPLOMA_NFT_CONTRACT);
        const adminKeypair = DiplomaUtils.keypairFromSecret(ADMIN_SECRET_KEY);
        
        // Create diploma data
        const diplomaData = {
            student_name: "John Doe",
            course: "Computer Science",
            institution: "Tech University",
            graduation_date: "2024-06-15",
            timestamp: Date.now()
        };
        
        // Generate hash
        const diplomaHash = DiplomaUtils.createDiplomaHash(diplomaData);
        
        console.log("🎓 Minting diploma NFT...");
        console.log("Student:", diplomaData.student_name);
        console.log("Course:", diplomaData.course);
        console.log("Hash:", diplomaHash);
        
        const result = await diplomaNFT.mintDiploma(
            adminKeypair,
            RECIPIENT_ADDRESS,
            1, // Token ID
        );
        
        console.log("✅ Diploma NFT minted successfully!");
        console.log("Transaction hash:", result.hash);
        
    } catch (error) {
        console.error("❌ Error minting diploma:", error.message);
    }
}

// Export for CommonJS
module.exports = {
    DiplomaNFTInteraction,
    DiplomaUtils,
    main,
    mintDiplomaExample,
    // Export constants for external use
    SOROBAN_RPC_URL,
    HORIZON_URL,
    NETWORK_PASSPHRASE
};

// Run main if this file is executed directly
if (require.main === module) {
    main();
}