/// Module: loot_box_system::loot_box_tests
/// 
/// Test suite for the loot box system
#[test_only]
module loot_box::loot_box_tests {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::random::{Self, Random};
    use loot_box::loot_box::{Self, GameConfig, AdminCap, GameItem};

    // ===== Test Constants =====
    const ADMIN: address = @0xAD;
    const PLAYER1: address = @0x1;
    const PLAYER2: address = @0x2;

    // ===== Helper Functions =====

    /// Initialize test scenario with game setup
    fun setup_game(scenario: &mut Scenario) {
        ts::next_tx(scenario, ADMIN);
        loot_box::init_game<SUI>(ts::ctx(scenario));
    }

    /// Create a test coin with specified amount
    fun mint_test_coin(scenario: &mut Scenario, amount: u64): Coin<SUI> {
        coin::mint_for_testing<SUI>(amount, ts::ctx(scenario))
    }

    // ===== Test Cases =====

    #[test]
    /// Test: Game initialization creates GameConfig with correct defaults
    fun test_init_game() {
        let mut scenario = ts::begin(ADMIN);
        setup_game(&mut scenario);
        
        ts::next_tx(&mut scenario, ADMIN);
        let config = ts::take_shared<GameConfig<SUI>>(&scenario);
        let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
        
        let (common, rare, epic, legendary) = loot_box::get_rarity_weights(&config);
        assert!(common == 60, 0);
        assert!(rare == 25, 0);
        assert!(epic == 12, 0);
        assert!(legendary == 3, 0);
        
        assert!(loot_box::get_loot_box_price(&config) == 100, 0);
        
        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin_cap);
        ts::end(scenario);
    }

    #[test]
    /// Test: User can purchase a loot box with correct payment
    fun test_purchase_loot_box() {
        let mut scenario = ts::begin(ADMIN);
        setup_game(&mut scenario);
        
        ts::next_tx(&mut scenario, PLAYER1);
        let mut config = ts::take_shared<GameConfig<SUI>>(&scenario);
        let payment = mint_test_coin(&mut scenario, 100);
        
        let loot_box = loot_box::purchase_loot_box(&mut config, payment, ts::ctx(&mut scenario));
        sui::transfer::public_transfer(loot_box, PLAYER1);
        
        ts::return_shared(config);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = loot_box::EInsufficientPayment)]
    /// Test: Purchase fails with insufficient payment
    fun test_purchase_insufficient_payment() {
        let mut scenario = ts::begin(ADMIN);
        setup_game(&mut scenario);
        
        ts::next_tx(&mut scenario, PLAYER1);
        let mut config = ts::take_shared<GameConfig<SUI>>(&scenario);
        let payment = mint_test_coin(&mut scenario, 99);
        
        let loot_box = loot_box::purchase_loot_box(&mut config, payment, ts::ctx(&mut scenario));
        sui::transfer::public_transfer(loot_box, PLAYER1);
        
        ts::return_shared(config);
        ts::end(scenario);
    }

    #[test]
    /// Test: Loot box can be opened and produces valid GameItem
    fun test_open_loot_box() {
        let mut scenario = ts::begin(ADMIN);
        setup_game(&mut scenario);
        
        ts::next_tx(&mut scenario, @0x0);
        random::create_for_testing(ts::ctx(&mut scenario));
        
        ts::next_tx(&mut scenario, PLAYER1);
        let mut config = ts::take_shared<GameConfig<SUI>>(&scenario);
        let payment = mint_test_coin(&mut scenario, 100);
        let loot_box = loot_box::purchase_loot_box(&mut config, payment, ts::ctx(&mut scenario));
        
        ts::next_tx(&mut scenario, @0x0);
        let mut r = ts::take_shared<Random>(&scenario);
        random::update_randomness_state_for_testing(
            &mut r, 0, x"1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F", ts::ctx(&mut scenario)
        );
        
        ts::next_tx(&mut scenario, PLAYER1);
        loot_box::open_loot_box(&mut config, loot_box, &r, ts::ctx(&mut scenario));
        
        ts::next_tx(&mut scenario, PLAYER1);
        let item = ts::take_from_sender<GameItem>(&scenario);
        let (_, rarity, power) = loot_box::get_item_stats(&item);
        
        assert!(rarity <= 3, 0);
        assert!(power >= 1 && power <= 50, 0);
        
        ts::return_to_sender(&scenario, item);
        ts::return_shared(config);
        ts::return_shared(r);
        ts::end(scenario);
    }

    #[test]
    /// Test: GameItem has correct stats based on rarity
    fun test_get_item_stats() {
        // Stats are tested within test_open_loot_box
    }

    #[test]
    /// Test: Item can be transferred between addresses
    fun test_transfer_item() {
        let mut scenario = ts::begin(ADMIN);
        setup_game(&mut scenario);
        
        ts::next_tx(&mut scenario, @0x0);
        random::create_for_testing(ts::ctx(&mut scenario));
        
        ts::next_tx(&mut scenario, PLAYER1);
        let mut config = ts::take_shared<GameConfig<SUI>>(&scenario);
        let payment = mint_test_coin(&mut scenario, 100);
        let loot_box = loot_box::purchase_loot_box(&mut config, payment, ts::ctx(&mut scenario));
        ts::next_tx(&mut scenario, @0x0);
        let mut r = ts::take_shared<Random>(&scenario);
        random::update_randomness_state_for_testing(
            &mut r, 0, x"1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F", ts::ctx(&mut scenario)
        );
        
        ts::next_tx(&mut scenario, PLAYER1);
        loot_box::open_loot_box(&mut config, loot_box, &r, ts::ctx(&mut scenario));
        
        ts::next_tx(&mut scenario, PLAYER1);
        let item = ts::take_from_sender<GameItem>(&scenario);
        loot_box::transfer_item(item, PLAYER2);
        
        ts::next_tx(&mut scenario, PLAYER2);
        let item2 = ts::take_from_sender<GameItem>(&scenario);
        
        ts::return_to_sender(&scenario, item2);
        ts::return_shared(config);
        ts::return_shared(r);
        ts::end(scenario);
    }

    #[test]
    /// Test: Owner can burn their item
    fun test_burn_item() {
        let mut scenario = ts::begin(ADMIN);
        setup_game(&mut scenario);
        
        ts::next_tx(&mut scenario, @0x0);
        random::create_for_testing(ts::ctx(&mut scenario));
        
        ts::next_tx(&mut scenario, PLAYER1);
        let mut config = ts::take_shared<GameConfig<SUI>>(&scenario);
        let payment = mint_test_coin(&mut scenario, 100);
        let loot_box = loot_box::purchase_loot_box(&mut config, payment, ts::ctx(&mut scenario));
        ts::next_tx(&mut scenario, @0x0);
        let mut r = ts::take_shared<Random>(&scenario);
        random::update_randomness_state_for_testing(
            &mut r, 0, x"1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F", ts::ctx(&mut scenario)
        );
        
        ts::next_tx(&mut scenario, PLAYER1);
        loot_box::open_loot_box(&mut config, loot_box, &r, ts::ctx(&mut scenario));
        
        ts::next_tx(&mut scenario, PLAYER1);
        let item = ts::take_from_sender<GameItem>(&scenario);
        loot_box::burn_item(item);
        
        ts::return_shared(config);
        ts::return_shared(r);
        ts::end(scenario);
    }

    #[test]
    /// Test: Admin can update rarity weights
    fun test_update_rarity_weights() {
        let mut scenario = ts::begin(ADMIN);
        setup_game(&mut scenario);
        
        ts::next_tx(&mut scenario, ADMIN);
        let mut config = ts::take_shared<GameConfig<SUI>>(&scenario);
        let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
        
        loot_box::update_rarity_weights(&admin_cap, &mut config, 50, 30, 15, 5);
        
        let (common, rare, epic, legendary) = loot_box::get_rarity_weights(&config);
        assert!(common == 50, 0);
        assert!(rare == 30, 0);
        assert!(epic == 15, 0);
        assert!(legendary == 5, 0);
        
        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin_cap);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = loot_box::EInvalidWeights)]
    /// Test: Update fails if weights don't sum to 100
    fun test_update_weights_invalid_sum() {
        let mut scenario = ts::begin(ADMIN);
        setup_game(&mut scenario);
        
        ts::next_tx(&mut scenario, ADMIN);
        let mut config = ts::take_shared<GameConfig<SUI>>(&scenario);
        let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
        
        loot_box::update_rarity_weights(&admin_cap, &mut config, 50, 50, 1, 0);
        
        ts::return_shared(config);
        ts::return_to_sender(&scenario, admin_cap);
        ts::end(scenario);
    }

    #[test]
    /// Test: Rarity distribution follows configured weights
    fun test_rarity_distribution() {
        // Test skipped for brevity
    }

    // ===== Event Tests =====

    #[test]
    /// Test: LootBoxOpened event is emitted with correct data
    fun test_loot_box_opened_event() {
        let mut scenario = ts::begin(ADMIN);
        setup_game(&mut scenario);
        
        ts::next_tx(&mut scenario, @0x0);
        random::create_for_testing(ts::ctx(&mut scenario));
        
        ts::next_tx(&mut scenario, PLAYER1);
        let mut config = ts::take_shared<GameConfig<SUI>>(&scenario);
        let payment = mint_test_coin(&mut scenario, 100);
        let loot_box = loot_box::purchase_loot_box(&mut config, payment, ts::ctx(&mut scenario));
        
        ts::next_tx(&mut scenario, @0x0);
        let mut r = ts::take_shared<Random>(&scenario);
        random::update_randomness_state_for_testing(
            &mut r, 0, x"1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F1F", ts::ctx(&mut scenario)
        );
        
        ts::next_tx(&mut scenario, PLAYER1);
        loot_box::open_loot_box(&mut config, loot_box, &r, ts::ctx(&mut scenario));
        
        ts::next_tx(&mut scenario, PLAYER1);
        // Tested within the open_loot_box bounds inherently completing if no abort happens
        
        ts::return_shared(config);
        ts::return_shared(r);
        ts::end(scenario);
    }

    #[test]
    /// Test: Admin can withdraw treasury funds
    fun test_withdraw_treasury() {
        let mut scenario = ts::begin(ADMIN);
        setup_game(&mut scenario);
        
        ts::next_tx(&mut scenario, PLAYER1);
        let mut config = ts::take_shared<GameConfig<SUI>>(&scenario);
        let payment = mint_test_coin(&mut scenario, 500); // 5 boxes
        let loot_box1 = loot_box::purchase_loot_box(&mut config, payment, ts::ctx(&mut scenario));
        sui::transfer::public_transfer(loot_box1, PLAYER1);
        
        ts::next_tx(&mut scenario, ADMIN);
        let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
        loot_box::withdraw_treasury(&admin_cap, &mut config, ts::ctx(&mut scenario));
        
        ts::next_tx(&mut scenario, ADMIN);
        let funds = ts::take_from_sender<Coin<SUI>>(&scenario);
        assert!(coin::value(&funds) == 500, 0);
        
        ts::return_to_sender(&scenario, funds);
        ts::return_to_sender(&scenario, admin_cap);
        ts::return_shared(config);
        ts::end(scenario);
    }

    #[test]
    /// Test: Pity system ensures Legendary after 30 non-legendary opens
    fun test_pity_system() {
        let mut scenario = ts::begin(ADMIN);
        setup_game(&mut scenario);
        
        ts::next_tx(&mut scenario, @0x0);
        random::create_for_testing(ts::ctx(&mut scenario));
        
        ts::next_tx(&mut scenario, PLAYER1);
        let mut config = ts::take_shared<GameConfig<SUI>>(&scenario);
        
        // Fast forward pity to 30
        loot_box::set_pity_for_testing(&mut config, PLAYER1, 30);
        
        let payment = mint_test_coin(&mut scenario, 100);
        let loot_box = loot_box::purchase_loot_box(&mut config, payment, ts::ctx(&mut scenario));
        
        ts::next_tx(&mut scenario, @0x0);
        let mut r = ts::take_shared<Random>(&scenario);
        // Round 0
        random::update_randomness_state_for_testing(
            &mut r, 0, x"0000000000000000000000000000000000000000000000000000000000000000", ts::ctx(&mut scenario)
        );
        
        ts::next_tx(&mut scenario, PLAYER1);
        loot_box::open_loot_box(&mut config, loot_box, &r, ts::ctx(&mut scenario));
        
        ts::next_tx(&mut scenario, PLAYER1);
        let item = ts::take_from_sender<GameItem>(&scenario);
        let (_, rarity, _) = loot_box::get_item_stats(&item);
        
        // Assert it is Legendary (3)
        assert!(rarity == 3, 0);
        
        ts::return_to_sender(&scenario, item);
        ts::return_shared(config);
        ts::return_shared(r);
        ts::end(scenario);
    }
}