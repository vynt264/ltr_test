const RIGHTS = {
    Super: {
        Code: 0,
        Name: 'super',
        Module: 'super',
        Title: 'super',
        Description: 'super_right',
    },
    Basic: {
        Code: 1,
        Name: 'basic',
        Module: 'basic',
        Title: 'basic',
        Description: 'basic_right',
    },
    CreateAdminUser: {
        Code: 2,
        Name: 'create_admin_user',
        Module: 'admin_user',
        Title: 'Tạo user',
        Description: 'create_admin_user',
        App: 'lottery',
    },
    EditAdminUser: {
        Code: 3,
        Name: 'edit_admin_user',
        Module: 'admin_user',
        Title: 'Edit user',
        Description: 'edit_admin_user',
        App: 'lottery',
    },
    DeleteAdminUser: {
        Code: 4,
        Name: 'delete_admin_user',
        Module: 'admin_user',
        Title: 'Xoá user',
        Description: 'delete_admin_user',
        App: 'lottery',
    },
    ShowListAdminUsers: {
        Code: 5,
        Name: 'show_list_admin_user',
        Module: 'admin_user',
        Title: 'Show users',
        Description: 'show_list_admin_user',
        App: 'lottery',
    },
    // SearchListAdminUsers: {
    //     Code: 6,
    //     Name: 'search_admin_users',
    //     Module: 'admin_user',
    //     Title: 'Search admin users',
    //     Description: 'search_admin_users',
    //     App: 'lottery',
    // },
    // Allow selections bookmarker to search or create
    AllowSearchFromBookmarker: {
        Code: 7,
        Name: 'allow_search_from_bookmarker',
        Module: 'selection_bookmarker',
        Title: 'Allow search from bookmarker',
        Description: 'allow_search_from_bookmarker',
        App: 'lottery',
    },
    AllowCreateOrEditFromBookmarker: {
        Code: 8,
        Name: 'allow_create_or_edit_from_bookmarker',
        Module: 'selection_bookmarker',
        Title: 'Allow create or edit from bookmarker',
        Description: 'allow_create_or_edit_from_bookmarker',
        App: 'lottery',
    },
    // report orders by book marker
    ShowReportOrdersByBookmarker: {
        Code: 9,
        Name: 'show_report_orders_by_bookmarker',
        Module: 'report_orders_by_bookmarker',
        Title: 'Show orders by bookmarker',
        Description: 'show_report_orders_by_bookmarker',
        App: 'lottery',
    },
    // SearchReportOrdersByBookmarker: {
    //     Code: 10,
    //     Name: 'search_report_orders_by_bookmarker',
    //     Module: 'report_orders_by_bookmarker',
    //     Title: 'Search orders by bookmarker',
    //     Description: 'search_report_orders_by_bookmarker',
    //     App: 'lottery',
    // },
    ExportExcelReportOrdersByBookmarker: {
        Code: 11,
        Name: 'export_excel_report_orders_by_bookmarker',
        Module: 'report_orders_by_bookmarker',
        Title: 'Export excel orders',
        Description: 'export_excel_report_orders_by_bookmarker',
        App: 'lottery',
    },
    // report orders by game
    ShowReportOrdersByGame: {
        Code: 12,
        Name: 'show_report_orders_by_game',
        Module: 'report_orders_by_game',
        Title: 'Show orders by game',
        Description: 'show_report_orders_by_game',
        App: 'lottery',
    },
    // SearchReportOrdersByGame: {
    //     Code: 13,
    //     Name: 'search_report_orders_by_game',
    //     Module: 'report_orders_by_game',
    //     Title: 'Search orders by game',
    //     Description: 'search_report_orders_by_game',
    //     App: 'lottery',
    // },
    ExportExcelReportOrdersByGame: {
        Code: 14,
        Name: 'export_excel_report_orders_by_game',
        Module: 'report_orders_by_game',
        Title: 'Export excel orders',
        Description: 'export_excel_report_orders_by_game',
        App: 'lottery',
    },
    // report orders by user
    ShowReportOrdersByUser: {
        Code: 15,
        Name: 'show_report_orders_by_user',
        Module: 'report_orders_by_user',
        Title: 'Show orders by user',
        Description: 'show_report_orders_by_user',
        App: 'lottery',
    },
    // SearchReportOrdersByUser: {
    //     Code: 16,
    //     Name: 'search_report_orders_by_user',
    //     Module: 'report_orders_by_user',
    //     Title: 'Search orders by user',
    //     Description: 'search_report_orders_by_user',
    //     App: 'lottery',
    // },
    ExportExcelReportOrdersByUser: {
        Code: 17,
        Name: 'export_excel_report_orders_by_user',
        Module: 'report_orders_by_user',
        Title: 'Export excel orders',
        Description: 'export_excel_report_orders_by_user',
        App: 'lottery',
    },
    // report orders
    ShowReportOrders: {
        Code: 18,
        Name: 'show_report_by_orders',
        Module: 'report_by_orders',
        Title: 'Show orders',
        Description: 'show_report_by_orders',
        App: 'lottery',
    },
    // SearchReportOrders: {
    //     Code: 19,
    //     Name: 'search_report_orders',
    //     Module: 'report_by_orders',
    //     Title: 'Search orders',
    //     Description: 'search_report_orders',
    //     App: 'lottery',
    // },
    ExportExcelReportOrders: {
        Code: 20,
        Name: 'export_excel_report_orders',
        Module: 'report_by_orders',
        Title: 'Export excel orders',
        Description: 'export_excel_report_orders',
        App: 'lottery',
    },
    // lottery award 
    ShowLotteryAwardXNS: {
        Code: 21,
        Name: 'show_lottery_award_xns',
        Module: 'lotterty_award_xns',
        Title: 'Show lottery award xns',
        Description: 'show_report_by_orders',
        App: 'lottery',
    },
    // SearchLotteryAwardXNS: {
    //     Code: 22,
    //     Name: 'search_lottery_award_xns',
    //     Module: 'lotterty_award_xns',
    //     Title: 'Search lottery award xns',
    //     Description: 'search_report_by_orders',
    //     App: 'lottery',
    // },
    // wallet history
    ShowWalletHistory: {
        Code: 23,
        Name: 'show_wallet_history',
        Module: 'wallet_history',
        Title: 'Show wallet history',
        Description: 'show_wallet_history',
        App: 'common',
    },
    // SearchWalletHistory: {
    //     Code: 24,
    //     Name: 'search_wallet_history',
    //     Module: 'wallet_history',
    //     Title: 'Search wallet history',
    //     Description: 'search_wallet_history',
    //     App: 'common',
    // },
    ExportExcelWalletHistory: {
        Code: 25,
        Name: 'export_excel_wallet_history',
        Module: 'wallet_history',
        Title: 'Export excel wallet history',
        Description: 'export_excel_wallet_history',
        App: 'common',
    },
    // setting system - homepage
    // setting layout
    ShowSettingLayout: {
        Code: 26,
        Name: 'show_setting_layout',
        Module: 'setting_layout',
        Title: 'Show setting layout',
        Description: 'show_setting_layout',
        App: 'common',
    },
    EditSettingLayout: {
        Code: 27,
        Name: 'edit_setting_layout',
        Module: 'setting_layout',
        Title: 'Edit setting layout',
        Description: 'edit_setting_layout',
        App: 'common',
    },
    // setting bxh fake
    ShowSettingRankFake: {
        Code: 28,
        Name: 'show_setting_rank_fake',
        Module: 'setting_rank_fake',
        Title: 'Show setting rank_fake',
        Description: 'show_setting_rank_fake',
        App: 'common',
    },
    CreateSettingLayout: {
        Code: 29,
        Name: 'create_setting_rank_fake',
        Module: 'setting_rank_fake',
        Title: 'Create setting rank_fake',
        Description: 'create_setting_rank_fake',
        App: 'common',
    },
    // setting Q&A
    ShowSettingQA: {
        Code: 30,
        Name: 'show_setting_qa',
        Module: 'setting_qa',
        Title: 'Show setting qa',
        Description: 'show_setting_qa',
        App: 'common',
    },
    CreateSettingQA: {
        Code: 31,
        Name: 'create_setting_qa',
        Module: 'setting_qa',
        Title: 'Create setting qa',
        Description: 'create_setting_qa',
        App: 'common',
    },
    EditSettingQA: {
        Code: 32,
        Name: 'edit_setting_qa',
        Module: 'setting_qa',
        Title: 'Edit setting qa',
        Description: 'edit_setting_qa',
        App: 'common',
    },
    DeleteSettingQA: {
        Code: 33,
        Name: 'delete_setting_qa',
        Module: 'setting_qa',
        Title: 'Delete setting qa',
        Description: 'delete_setting_qa',
        App: 'common',
    },
    // setting game text
    ShowSettingGameText: {
        Code: 34,
        Name: 'show_setting_game_text',
        Module: 'setting_game_text',
        Title: 'Show setting game text',
        Description: 'show_setting_game_text',
        App: 'common',
    },
    EditSettingGameText: {
        Code: 35,
        Name: 'edit_setting_game_text',
        Module: 'setting_game_text',
        Title: 'Edit setting game text',
        Description: 'edit_setting_game_text',
        App: 'common',
    },
    // setting bonus

    // setting game
    // setting game xsn
    ShowSettingXSNCommon: {
        Code: 36,
        Name: 'show_setting_xsn_common',
        Module: 'setting_xsn_common',
        Title: 'Show setting xsn common',
        Description: 'show_setting_xsn_common',
        App: 'lottery',
    },
    EditSettingXSNCommon: {
        Code: 37,
        Name: 'edit_setting_xsn_common',
        Module: 'setting_xsn_common',
        Title: 'Edit setting xsn common',
        Description: 'edit_setting_xsn_common',
        App: 'lottery',
    },
    ShowSettingXSNBonus: {
        Code: 38,
        Name: 'show_setting_xsn_bonus',
        Module: 'setting_xsn_bonus',
        Title: 'Show setting xsn bonus',
        Description: 'show_setting_xsn_bonus',
        App: 'lottery',
    },
    EditSettingXSNBonus: {
        Code: 39,
        Name: 'edit_setting_xsn_bonus',
        Module: 'setting_xsn_bonus',
        Title: 'Edit setting xsn bonus',
        Description: 'edit_setting_xsn_bonus',
        App: 'lottery',
    },
    CreateSettingXSNBonus: {
        Code: 56,
        Name: 'create_setting_xsn_bonus',
        Module: 'setting_xsn_bonus',
        Title: 'Edit setting xsn bonus',
        Description: 'create_setting_xsn_bonus',
        App: 'lottery',
    },
    DeleteSettingXSNBonus: {
        Code: 57,
        Name: 'delete_setting_xsn_bonus',
        Module: 'setting_xsn_bonus',
        Title: 'Delete setting xsn bonus',
        Description: 'delete_setting_xsn_bonus',
        App: 'lottery',
    },
    // setting game lottery traditional

    // setting game originals
    ShowSettingOriginals: {
        Code: 40,
        Name: 'show_setting_orginals',
        Module: 'setting_orginals',
        Title: 'Show setting orginals',
        Description: 'show_setting_orginals',
        App: 'casino',
    },
    EditSettingOriginals: {
        Code: 41,
        Name: 'edit_setting_orginals',
        Module: 'setting_orginals',
        Title: 'Edit setting orginals',
        Description: 'edit_setting_orginals',
        App: 'casino',
    },
    // game manager
    ShowGameManager: {
        Code: 46,
        Name: 'show_game_manager',
        Module: 'game_manager',
        Title: 'Show game manager',
        Description: 'show_game_manager',
        App: 'common',
    },
    EditGameManager: {
        Code: 47,
        Name: 'edit_game_manager',
        Module: 'game_manager',
        Title: 'Edit game manager',
        Description: 'edit_game_manager',
        App: 'common',
    },
    // roles
    CreateRole: {
        Code: 48,
        Name: 'create_role',
        Module: 'roles',
        Title: 'Tạo role',
        Description: 'create_role',
        App: 'lottery',
    },
    EditRole: {
        Code: 49,
        Name: 'edit_role',
        Module: 'roles',
        Title: 'Edit role',
        Description: 'edit_role',
        App: 'lottery',
    },
    DeleteRole: {
        Code: 50,
        Name: 'delete_role',
        Module: 'roles',
        Title: 'Xoá role',
        Description: 'delete_role',
        App: 'lottery',
    },
    ShowListRoles: {
        Code: 51,
        Name: 'show_list_roles',
        Module: 'roles',
        Title: 'Show roles',
        Description: 'show_list_roles',
        App: 'lottery',
    },
    // management bookmarkers
    CreateBookmarker: {
        Code: 52,
        Name: 'create_bookmarker',
        Module: 'management_bookmarkers',
        Title: 'Tạo bookmarker',
        Description: 'create_bookmarker',
        App: 'lottery',
    },
    EditBookmarker: {
        Code: 53,
        Name: 'edit_bookmarker',
        Module: 'management_bookmarkers',
        Title: 'Edit bookmarker',
        Description: 'edit_bookmarker',
        App: 'lottery',
    },
    DeleteBookmarker: {
        Code: 54,
        Name: 'delete_bookmarker',
        Module: 'management_bookmarkers',
        Title: 'Xoá bookmarker',
        Description: 'delete_bookmarker',
        App: 'lottery',
    },
    ShowListBookmarkers: {
        Code: 55,
        Name: 'show_bookmarkers',
        Module: 'management_bookmarkers',
        Title: 'Show bookmarkers',
        Description: 'management_bookmarkers',
        App: 'lottery',
    },
};

const RIGHTS_DEFAULT = ['basic'];
const SUPPER_ROLE = 'super';

export {
    RIGHTS,
    RIGHTS_DEFAULT,
    SUPPER_ROLE,
};