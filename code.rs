use log::Level;
use log::info;
fn main() {
    console_log::init_with_level(Level::Debug);

    info!("It works!");

}