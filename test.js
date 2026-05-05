uint256 thresholdMm = 40;
uint256 windowDays  = 30;

function checkTrigger(bytes32 policyId) external {
    uint256 r1 = oracle.getRain(policyId, windowDays, "NMS");
    uint256 r2 = oracle.getRain(policyId, windowDays, "IoT");
    uint256 r3 = oracle.getRain(policyId, windowDays, "Sat");

    uint256 R = median(r1, r2, r3);
    if (R < thresholdMm) {
        uint256 payout = calculatePayout(policyId, R);
        disburse(policyId, payout);
        emit PayoutExecuted(policyId, R, payout);
    }
}