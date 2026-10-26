// ========================
// Hide VibeKit badge (injected inline style with !important, CSS can't override)
// ========================
(function removeVibeKitBadge() {
    var badge = document.querySelector('a[data-vibekit-badge]');
    if (badge && badge.parentNode) badge.parentNode.removeChild(badge);
    // Also remove the badge-fit script to prevent re-injection
    var scripts = document.querySelectorAll('script[data-vibekit-badge-fit]');
    scripts.forEach(function(s) { s.parentNode && s.parentNode.removeChild(s); });
})();

// ========================
// GLOBAL STATE
// ========================
let state = {
    currentUser: {
        id: null,
        username: null,
        name: 'Guest',
        role: '',
        avatar: '?'
    },
    loggedIn: false,
    currentPage: 'login',
    prices: {
        clientPricePerGen: 480000,
        agentPricePerGen: 450000,
        supplierPricePerGen: 470000,
        dieselPricePerLiter: 6800,
        litersPerGen: 33
    },
    customPrices: {},
    preferences: {
        currency: 'IDR',
        measurementUnit: 'GEN',
        language: 'id',
        dateFormat: 'YYYY-MM-DD'
    },
    agents: [
        { id: 1, name: 'Ahmed Traders', genQty: 100, litersQty: 3300, status: 'completed', balance: 0, dieselProvided: 3300 },
        { id: 2, name: 'Hassan Fuel Co', genQty: 50, litersQty: 1650, status: 'pending', balance: 22500000, dieselProvided: 1650 },
        { id: 3, name: 'Rashid Diesel', genQty: 75, litersQty: 2475, status: 'completed', balance: 0, dieselProvided: 2475 }
    ],
    clients: [
        { id: 1, name: 'City Garage', genQty: 80, status: 'active', balance: 38400000 },
        { id: 2, name: 'Express Fuel', genQty: 120, status: 'active', balance: 57600000 }
    ],
    transactions: [
        { id: 1, type: 'sale', counterparty: 'City Garage', qty: 80, unit: 'gen', rate: 480000, amount: 38400000, status: 'completed', date: '2026-10-08' },
        { id: 2, type: 'purchase', counterparty: 'Ahmed Traders', qty: 100, unit: 'gen', rate: 450000, amount: 45000000, status: 'completed', date: '2026-10-09' },
        { id: 3, type: 'purchase', counterparty: 'Hassan Fuel Co', qty: 50, unit: 'gen', rate: 450000, amount: 22500000, status: 'pending', date: '2026-10-10' }
    ],
    inventory: {
        dieselFromAgents: 100,
        dieselFromSuppliers: 60,
        totalGen: 160,
        usedGen: 80,
        availGen: 80
    },
    agentRequests: [],
    clientRequests: [],
    orderRequests: [],
    users: defaultUsers(),
    activeModal: null,
    transFilter: 'all',
    reportFilter: 'all'
};

const translations = {
    en: {
        nav: {
            dashboard: 'Dashboard',
            transactions: 'Transactions',
            agents: 'Agents',
            clients: 'Clients',
            inventory: 'Inventory',
            reports: 'Reports',
            users: 'User Management',
            settings: 'Settings',
            logout: 'Logout',
            requestOrder: 'Request Order',
            requestGen: 'Request Gen'
        },
        titles: {
            dashboard: 'Dashboard',
            dashboard_sub: 'Overview of your diesel fuel business',
            transactions: 'Transactions',
            transactions_sub: 'Manage all financial transactions',
            agents: 'Agents',
            agents_sub: 'Manage your diesel suppliers',
            clients: 'Clients',
            clients_sub: 'Manage your customer accounts',
            inventory: 'Inventory',
            inventory_sub: 'Track diesel stock levels',
            reports: 'Reports',
            reports_sub: 'Financial and operational reports',
            users: 'User Management',
            settings: 'Settings',
            logout: 'Logout',
            requestOrder: 'Request Order',
            requestOrder_sub: 'Request diesel GEN from admin',
            requestGen: 'Request Gen',
            requestGen_sub: 'Request GEN supply to admin'
        },
        dashboard: {
            totalSales: 'Total Sales',
            totalPurchases: 'Total Purchases',
            netProfit: 'Net Profit',
            availDiesel: 'Available Diesel',
            recentTrans: 'Recent Transactions',
            viewAll: 'View All',
            fromLastMonth: 'from last month',
            fromYesterday: 'from yesterday',
            myProfit: 'My Profit',
            profitPerGen: 'Profit per GEN',
            currentOrderProgress: 'Current Order Progress',
            totalPurchased: 'Total Purchased',
            dieselProvided: 'Diesel Provided',
            quotaToFulfill: 'Quota to Fulfill',
            myTransactions: 'My Transactions',
            availableDieselQuota: 'Available Diesel Quota',
            targetMet: 'Target Met',
            profitPerGenLabel: 'Profit / GEN',
            dieselProvidedLabel: 'Diesel Provided',
            netMargin: 'net margin',
            ofSales: 'of sales',
            used: 'used'
        },
        table: {
            date: 'Date',
            type: 'Type',
            counterparty: 'Counterparty',
            quantity: 'Quantity',
            rate: 'Rate',
            ratePerGen: 'Rate (per gen)',
            amount: 'Amount',
            status: 'Status',
            actions: 'Actions',
            unit: 'Unit'
        },
        agents: {
            myAgents: 'My Agents',
            addAgent: 'Add Agent',
            totalAgentDiesel: 'Total Agent Diesel',
            avgRate: 'Avg Rate per GEN',
            totalAgentCost: 'Total Agent Cost',
            agentPays: 'Agent pays this per gen',
            agentName: 'Agent Name',
            genQty: 'Gen Qty',
            litersQty: 'Liters Qty',
            balance: 'Balance',
            dieselRequest: 'Agent Diesel Request',
            requestQty: 'GEN Quantity to Request',
            enterQty: 'Enter GEN quantity',
            selectAgent: 'Select Agent',
            sendRequest: 'Send Request',
            amountToPay: 'Amount to pay agent:',
            view: 'View',
            pay: 'Pay',
            paid: 'Paid',
            due: 'Due',
            approve: 'Approve',
            approved: 'Approved',
            approveRequest: 'Approve Agent Request',
            requestApproved: 'Request approved! Funds given to agent.',
            genDelivered: 'GEN Delivered',
            confirmDelivery: 'Confirm Delivery',
            deliveryConfirmed: 'Delivery confirmed. Awaiting admin verification.',
            verifyFulfillment: 'Verify Fulfillment',
            fulfillmentVerified: 'Fulfillment verified. Order completed!',
            orderComplete: 'Completed',
            orderPending: 'Pending Approval',
            orderApproved: 'Approved - Money Given',
            orderDelivered: 'Delivered - Awaiting Confirmation',
            orderConfirmed: 'Confirmed - Awaiting Verification',
            orderUnfulfilled: 'Unfulfilled',
            targetQty: 'Target Qty',
            deliveredQty: 'Delivered Qty',
            agentRequest: 'Agent Request',
            agentRequests: 'Agent Requests',
            genQty: 'Gen Qty',
            requestedAmount: 'Requested Amount',
            remainingToDeliver: 'Remaining to Deliver',
            approveAndPay: 'Approve & Pay',
            confirmGenDelivered: 'Confirm GEN Delivered',
            adminVerify: 'Admin Verify',
            verify: 'Verify',
            reject: 'Reject',
            rejected: 'Rejected',
            allDelivered: 'All GEN quantities have been delivered',
            enterDeliveredQty: 'Enter delivered GEN quantity',
            awaitingConfirm: 'Awaiting confirmation',
            myRequests: 'My Requests'
        },
        clients: {
            myClients: 'My Clients',
            addClient: 'Add Client',
            clientName: 'Client Name',
            purchasedGen: 'Purchased Gen',
            ratePerGen: 'Rate per GEN',
            viewOrders: 'View Orders',
            orderAmount: 'Order Amount',
            requestSubmitted: 'Order request submitted',
            enterGenQty: 'Enter GEN quantity to order',
            totalToPay: 'Total to pay',
            maxOrderable: 'Max orderable',
            myOrders: 'My Orders',
            orderRequests: 'Order Requests',
            approveOrder: 'Approve Order'
        },
        inventory: {
            breakdown: 'Inventory Breakdown',
            source: 'Source',
            qtyGen: 'Quantity (GEN)',
            liters: 'Liters',
            ratePerGen: 'Rate per GEN',
            totalCost: 'Total Cost',
            available: 'Available',
            total: 'TOTAL',
            utilization: 'Utilization',
            dieselUtil: 'Diesel Utilization',
            agentDiesel: 'Agent Diesel',
            supplierDiesel: 'Supplier Diesel',
            acquired: "You've acquired",
            ofDiesel: 'GEN of diesel',
            and: 'and',
            soldToClients: 'GEN has been sold to clients.',
            currentlyAvail: 'GEN diesel is currently available',
            forNewOrders: 'for new client orders.'
        },
        reports: {
            profitMargin: 'Profit Margin',
            totalSalesRev: 'Total Sales Revenue',
            totalPurchaseCost: 'Total Purchase Cost',
            netProfit: 'Net Profit',
            basedOn: 'Based on',
            transactions: 'transactions',
            profitBreakdown: 'Profit Breakdown by Counterparty',
            totalAmount: 'Total Amount',
            profitLoss: 'Profit/Loss',
            cost: 'Cost',
            sale: 'Sale',
            purchase: 'Purchase',
            profitChart: 'Profit Trend Chart',
            chartDesc: 'Interactive chart showing profit trends over time.',
            staticData: 'Data updates based on current records.',
            genInOut: 'GEN In/Out Summary',
            agentPerformance: 'Agent Performance',
            supplierPerformance: 'Supplier Performance',
            clientOrders: 'Client Order Fulfillment',
            financialSummary: 'Financial Summary',
            exportExcel: 'Export to Excel',
            dateRange: 'Date Range',
            allData: 'All Data',
            genIn: 'GEN In',
            genOut: 'GEN Out',
            genBalance: 'GEN Balance',
            totalLiters: 'Total Liters',
            avgDieselCost: 'Avg Diesel Cost',
            providedGen: 'Provided GEN',
            fulfilledGen: 'Fulfilled GEN',
            pendingGen: 'Pending GEN',
            fulfillmentRate: 'Fulfillment Rate',
            orderStatus: 'Order Status',
            fulfilled: 'Fulfilled',
            pending: 'Pending',
            cancelled: 'Cancelled',
            chartTitle: 'Financial Overview',
            chartSubtitle: 'Revenue vs Cost by Date',
            loading: 'Loading...',
            noReportData: 'No data available for selected period',
            exportSuccess: 'Report exported to Excel successfully!',
            exportError: 'Failed to export report. Please try again.',
            agentName: 'Agent Name',
            genProvided: 'GEN Provided',
            totalRevenue: 'Total Revenue',
            totalCost: 'Total Cost',
            netProfit: 'Net Profit',
            supplierName: 'Supplier Name',
            litersProvided: 'Liters Provided',
            clientOrderFulfillment: 'Client Order Fulfillment',
            requestedGen: 'Requested GEN',
            deliveredGen: 'Delivered GEN',
            pendingDelivery: 'Pending Delivery'
        },
        users: {
            userManagement: 'User Management',
            addUser: 'Add User',
            save: 'Save',
            allUsers: 'All Users',
            admins: 'Admins',
            clients: 'Clients',
            agents: 'Agents',
            user: 'User',
            email: 'Email',
            role: 'Role',
            fullName: 'Full Name',
            phone: 'Phone Number',
            password: 'Password',
            nameHint: 'Enter full name',
            emailHint: 'Enter email',
            phoneHint: 'Enter phone number',
            passwordHint: 'Enter password',
            passwordHintEdit: 'Leave blank to keep current password',
            status: 'Status',
            active: 'Active',
            edit: 'Edit',
            username: 'Username',
            usernameHint: 'Enter username',
            logout: 'Logout',
            accessDenied: 'Access Denied',
            adminOnly: 'Only administrators can access this page.'
        },
        login: {
            title: 'Login',
            subtitle: 'Sign in to your account',
            username: 'Username',
            password: 'Password',
            usernameHint: 'Enter username',
            passwordHint: 'Enter password',
            button: 'Login',
            error: 'Invalid username or password.',
            errorEmpty: 'Please enter username and password.',
            hint: 'Demo credentials: admin / admin123'
        },
        settings: {
            pricingConfig: 'Pricing Configuration',
            clientPrice: 'Client Price (per GEN)',
            agentPrice: 'Agent Price (per GEN)',
            supplierPrice: 'Supplier Price (per GEN)',
            dieselPrice: 'Diesel Price per Liter',
            litersPerGen: 'Liters per GEN',
            clientPriceDesc: 'Price clients pay for each GEN of diesel',
            agentPriceDesc: 'Price agents pay for each GEN of diesel',
            supplierPriceDesc: 'Price from external diesel suppliers',
            dieselPriceDesc: 'Price of diesel per liter (Rp)',
            litersPerGenDesc: 'How many liters of diesel equal 1 GEN',
            profitMargin: 'Profit Margin',
            profitDiff: 'Difference between client and agent prices',
            saveConfig: 'Save Configuration',
            reset: 'Reset',
            customPricing: 'Custom Pricing',
            customPriceDesc: 'Set custom prices for specific clients or suppliers.',
            targetType: 'Target Type',
            selectAccount: 'Select Account',
            customPrice: 'Custom Price (per GEN)',
            action: 'Action',
            setCustomPrice: 'Set Custom Price',
            usingDefault: 'Using default',
            preferences: 'Preferences',
            currency: 'Currency',
            measurementUnit: 'Measurement Unit',
            language: 'Language',
            dateFormat: 'Date Format',
            savePrefs: 'Save Preferences',
            litersOnly: 'Liters Only',
            leaveBlank: 'Leave blank for default',
            deleteDatabase: 'Delete Database',
            deleteScope: 'Select data to delete',
            deleteTransactions: 'Transactions',
            deleteAgents: 'Agent Requests',
            deleteClients: 'Client Orders',
            deleteInventory: 'Inventory',
            deleteDateRange: 'Date range',
            deleteToday: 'Today',
            deleteWeek: 'This Week',
            deleteMonth: 'This Month',
            deleteLastMonth: 'Last Month',
            deleteAll: 'All Time (no date filter)',
            deleteCustomRange: 'Custom range',
            deleteFrom: 'From',
            deleteTo: 'To',
            deleteBtn: 'Delete Database',
            deleteConfirm1: 'WARNING: This will permanently delete selected data from the database and browser. This cannot be undone.',
            deleteConfirm2: 'Type DELETE to confirm permanent deletion',
            deleteSuccess: 'Data deleted successfully',
            deleteError: 'Failed to delete data',
            deleteCancelled: 'Deletion cancelled',
            deleteUsers: 'Users'
        },
        alerts: {
            settingsSaved: 'Settings saved successfully!',
            newProfitMargin: 'New Profit Margin: Rp',
            settingsReset: 'Settings reset to defaults',
            customPriceSaved: 'Custom price saved!',
            customPriceCleared: 'Custom price cleared.',
            prefsSaved: 'Preferences saved successfully!',
            addTransaction: 'Add Transaction',
            addAgent: 'Add New Agent',
            addClient: 'Add New Client',
            addUser: 'Add New User',
            agentRequestSubmitted: 'Agent Request Submitted!',
            confirmWarn: 'Are you sure?',
            invalidQty: 'Please enter a valid quantity.',
            logoutConfirm: 'Are you sure you want to logout?',
            filterAll: 'All',
            filterByStatus: 'Filter by Status',
            filterByType: 'Filter by Type',
            filterClear: 'Clear',
            viewDetails: 'View Details',
            payAgent: 'Pay Agent',
            noData: 'No data available.',
            searchPlaceholder: 'Search...',
            orderSubmitted: 'Order request submitted!',
            genRequestSubmitted: 'GEN request submitted!',
            insufficientDiesel: 'Insufficient diesel available.',
            week: 'This Week',
            month: 'This Month',
            lastMonth: 'Last Month',
            today: 'Today',
            fulfilled: 'Fulfilled',
            unfulfilled: 'Unfulfilled',
            dieselCost: 'Diesel Cost',
            deleteConfirm: 'Are you sure you want to delete this item? This cannot be undone.',
            deleteItem: 'Delete'
        }
    },
    id: {
        nav: {
            dashboard: 'Beranda',
            transactions: 'Transaksi',
            agents: 'Agen',
            clients: 'Klien',
            inventory: 'Persediaan',
            reports: 'Laporan',
            users: 'Kelola Pengguna',
            settings: 'Pengaturan',
            logout: 'Keluar',
            requestOrder: 'Permintaan Pesan',
            requestGen: 'Permintaan Gen'
        },
        titles: {
            dashboard: 'Beranda',
            dashboard_sub: 'Ikhtisar bisnis bahan bakar diesel Anda',
            transactions: 'Transaksi',
            transactions_sub: 'Kelola semua transaksi keuangan',
            agents: 'Agen',
            agents_sub: 'Kelola agen diesel Anda',
            clients: 'Klien',
            clients_sub: 'Kelola akun pelanggan Anda',
            inventory: 'Persediaan',
            inventory_sub: 'Lacak tingkat stok diesel',
            reports: 'Laporan',
            reports_sub: 'Laporan keuangan dan operasional',
            users: 'Kelola Pengguna',
            settings: 'Pengaturan',
            logout: 'Keluar',
            requestOrder: 'Permintaan Pesan',
            requestOrder_sub: 'Minta diesel GEN dari admin',
            requestGen: 'Permintaan Gen',
            requestGen_sub: 'Minta pasokan GEN ke admin'
        },
        dashboard: {
            totalSales: 'Total Penjualan',
            totalPurchases: 'Total Pembelian',
            netProfit: 'Keuntungan Bersih',
            availDiesel: 'Diesel Tersedia',
            recentTrans: 'Transaksi Terbaru',
            viewAll: 'Lihat Semua',
            fromLastMonth: 'dari bulan lalu',
            fromYesterday: 'dari kemarin',
            myProfit: 'Keuntungan Saya',
            profitPerGen: 'Keuntungan per GEN',
            currentOrderProgress: 'Progres Pesanan Saat Ini',
            totalPurchased: 'Total yang Dibeli',
            dieselProvided: 'Diesel yang Disediakan',
            quotaToFulfill: 'Kuota yang Harus Dipenuhi',
            myTransactions: 'Transaksi Saya',
            availableDieselQuota: 'Kuota Diesel yang Tersedia',
            targetMet: 'Target Terpenuhi',
            profitPerGenLabel: 'Keuntungan / GEN',
            dieselProvidedLabel: 'Diesel yang Disediakan',
            netMargin: 'margin bersih',
            ofSales: 'dari penjualan',
            used: 'digunakan'
        },
        table: {
            date: 'Tanggal',
            type: 'Tipe',
            counterparty: 'Kontrpartai',
            quantity: 'Kuantitas',
            rate: 'Tarif',
            ratePerGen: 'Tarif (per gen)',
            amount: 'Jumlah',
            status: 'Status',
            actions: 'Aksi',
            unit: 'Satuan'
        },
        agents: {
            myAgents: 'Agen Saya',
            addAgent: 'Tambah Agen',
            totalAgentDiesel: 'Total Diesel Agen',
            avgRate: 'Rata-rata Tarif per GEN',
            totalAgentCost: 'Total Biaya Agen',
            agentPays: 'Agen membayar ini per gen',
            agentName: 'Nama Agen',
            genQty: 'Kuantitas GEN',
            litersQty: 'Kuantitas Liter',
            balance: 'Saldo',
            dieselRequest: 'Permintaan Diesel Agen',
            requestQty: 'Kuantitas GEN yang Diminta',
            enterQty: 'Masukkan kuantitas GEN',
            selectAgent: 'Pilih Agen',
            sendRequest: 'Kirim Permintaan',
            amountToPay: 'Jumlah untuk dibayar ke agen:',
            view: 'Lihat',
            pay: 'Bayar',
            paid: 'Dibayar',
            due: 'Jatuh Tempo',
            approve: 'Setujui',
            approved: 'Disetujui',
            approveRequest: 'Setujui Permintaan Agen',
            requestApproved: 'Permintaan disetujui! Dana diberikan ke agen.',
            genDelivered: 'GEN Terkirim',
            confirmDelivery: 'Konfirmasi Pengiriman',
            deliveryConfirmed: 'Pengiriman dikonfirmasi. Menunggu verifikasi admin.',
            verifyFulfillment: 'Verifikasi Pemenuhan',
            fulfillmentVerified: 'Pemenuhan diverifikasi. Pesanan selesai!',
            orderComplete: 'Selesai',
            orderPending: 'Menunggu Persetujuan',
            orderApproved: 'Disetujui - Dana Dibayar',
            orderDelivered: 'Terkirim - Menunggu Konfirmasi',
            orderConfirmed: 'Dikonfirmasi - Menunggu Verifikasi',
            orderUnfulfilled: 'Belum Terpenuhi',
            targetQty: 'Kuota Target',
            deliveredQty: 'Kuantitas Terkirim',
            agentRequest: 'Permintaan Agen',
            agentRequests: 'Permintaan Agen',
            genQty: 'Kuantitas GEN',
            requestedAmount: 'Jumlah yang Diminta',
            remainingToDeliver: 'Sisa yang Harus Dikirim',
            approveAndPay: 'Setujui & Bayar',
            confirmGenDelivered: 'Konfirmasi GEN Terkirim',
            adminVerify: 'Verifikasi Admin',
            verify: 'Verifikasi',
            reject: 'Tolak',
            rejected: 'Ditolak',
            allDelivered: 'Semua kuantitas GEN telah terkirim',
            enterDeliveredQty: 'Masukkan kuantitas GEN yang terkirim',
            awaitingConfirm: 'Menunggu konfirmasi',
            myRequests: 'Permintaan Saya'
        },
        clients: {
            myClients: 'Klien Saya',
            addClient: 'Tambah Klien',
            clientName: 'Nama Klien',
            purchasedGen: 'GEN yang Dibeli',
            ratePerGen: 'Tarif per GEN',
            viewOrders: 'Lihat Pesanan',
            orderAmount: 'Jumlah Pesanan',
            requestSubmitted: 'Permintaan pesanan terkirim',
            enterGenQty: 'Masukkan kuantitas GEN untuk dipesan',
            totalToPay: 'Total untuk dibayar',
            maxOrderable: 'Maksimal dipesan',
            myOrders: 'Pesanan Saya',
            orderRequests: 'Permintaan Pesanan',
            approveOrder: 'Setujui Pesanan'
        },
        inventory: {
            breakdown: 'Rincian Persediaan',
            source: 'Sumber',
            qtyGen: 'Kuantitas (GEN)',
            liters: 'Liter',
            ratePerGen: 'Tarif per GEN',
            totalCost: 'Biaya Total',
            available: 'Tersedia',
            total: 'TOTAL',
            utilization: 'Utilisasi',
            dieselUtil: 'Utilisasi Diesel',
            agentDiesel: 'Diesel dari Agen',
            supplierDiesel: 'Diesel dari Pemasok',
            acquired: 'Anda telah memperoleh',
            ofDiesel: 'GEN diesel',
            and: 'dan',
            soldToClients: 'GEN telah terjual ke klien.',
            currentlyAvail: 'GEN diesel saat ini tersedia',
            forNewOrders: 'untuk pesanan klien baru.'
        },
        reports: {
            profitMargin: 'Margin Keuntungan',
            totalSalesRev: 'Total Pendapatan Penjualan',
            totalPurchaseCost: 'Total Biaya Pembelian',
            netProfit: 'Keuntungan Bersih',
            basedOn: 'Berdasarkan',
            transactions: 'transaksi',
            profitBreakdown: 'Rincian Keuntungan per Kontrpartai',
            totalAmount: 'Total Jumlah',
            profitLoss: 'Keuntungan/Rugi',
            cost: 'Biaya',
            sale: 'Jual',
            purchase: 'Beli',
            profitChart: 'Grafik Tren Keuntungan',
            chartDesc: 'Grafik interaktif yang menampilkan tren keuntungan.',
            staticData: 'Data diperbarui berdasarkan catatan saat ini.',
            genInOut: 'Ringkasan GEN Masuk/Keluar',
            agentPerformance: 'Kinerja Agen',
            supplierPerformance: 'Kinerja Pemasok',
            clientOrders: 'Pemenuhi Pesanan Klien',
            financialSummary: 'Ringkasan Keuangan',
            exportExcel: 'Ekspor ke Excel',
            dateRange: 'Rentang Tanggal',
            allData: 'Semua Data',
            genIn: 'GEN Masuk',
            genOut: 'GEN Keluar',
            genBalance: 'Saldo GEN',
            totalLiters: 'Total Liter',
            avgDieselCost: 'Rata-rata Biaya Diesel',
            providedGen: 'GEN yang Disediakan',
            fulfilledGen: 'GEN yang Terpenuhi',
            pendingGen: 'GEN yang Tertunda',
            fulfillmentRate: 'Tingkat Pemenuhan',
            orderStatus: 'Status Pesanan',
            fulfilled: 'Terpenuhi',
            pending: 'Tertunda',
            cancelled: 'Dibatalkan',
            chartTitle: 'Ikhtisar Keuangan',
            chartSubtitle: 'Pendapatan vs Biaya per Tanggal',
            loading: 'Memuat...',
            noReportData: 'Tidak ada data untuk periode yang dipilih',
            exportSuccess: 'Laporan berhasil diekspor ke Excel!',
            exportError: 'Gagal mengekspor laporan. Silakan coba lagi.',
            agentName: 'Nama Agen',
            genProvided: 'GEN yang Disediakan',
            totalRevenue: 'Total Pendapatan',
            totalCost: 'Total Biaya',
            netProfit: 'Keuntungan Bersih',
            supplierName: 'Nama Pemasok',
            litersProvided: 'Liter yang Disediakan',
            clientOrderFulfillment: 'Pemenuhi Pesanan Klien',
            requestedGen: 'GEN yang Diminta',
            deliveredGen: 'GEN yang Dikirim',
            pendingDelivery: 'Pengiriman Tertunda'
        },
        users: {
            userManagement: 'Kelola Pengguna',
            addUser: 'Tambah Pengguna',
            save: 'Simpan',
            allUsers: 'Semua Pengguna',
            admins: 'Admin',
            clients: 'Klien',
            agents: 'Agen',
            user: 'Pengguna',
            email: 'Email',
            role: 'Peran',
            fullName: 'Nama Lengkap',
            phone: 'Nomor Telepon',
            password: 'Kata Sandi',
            nameHint: 'Masukkan nama',
            emailHint: 'Masukkan email',
            phoneHint: 'Masukkan telepon',
            passwordHint: 'Masukkan kata sandi',
            passwordHintEdit: 'Kosongkan jika tidak diganti',
            status: 'Status',
            active: 'Aktif',
            edit: 'Edit',
            username: 'Username',
            usernameHint: 'Masukkan nama pengguna',
            logout: 'Keluar',
            accessDenied: 'Akses Ditolak',
            adminOnly: 'Hanya administrator yang dapat mengakses halaman ini.'
        },
        login: {
            title: 'Masuk',
            subtitle: 'Masuk ke akun Anda',
            username: 'Nama Pengguna',
            password: 'Kata Sandi',
            usernameHint: 'Masukkan nama pengguna',
            passwordHint: 'Masukkan kata sandi',
            button: 'Masuk',
            error: 'Nama pengguna atau kata sandi salah.',
            errorEmpty: 'Harap masukkan nama pengguna dan kata sandi.',
            hint: 'Kredensial demo: admin / admin123'
        },
        settings: {
            pricingConfig: 'Konfigurasi Harga',
            clientPrice: 'Harga Klien (per GEN)',
            agentPrice: 'Harga Agen (per GEN)',
            supplierPrice: 'Harga Pemasok (per GEN)',
            dieselPrice: 'Harga Diesel per Liter',
            litersPerGen: 'Liter per GEN',
            clientPriceDesc: 'Harga yang dibayar klien untuk setiap GEN diesel',
            agentPriceDesc: 'Harga yang dibayar agen untuk setiap GEN diesel',
            supplierPriceDesc: 'Harga dari pemasok diesel eksternal',
            dieselPriceDesc: 'Harga diesel per liter (Rp)',
            litersPerGenDesc: 'Berapa liter diesel yang setara dengan 1 GEN',
            profitMargin: 'Margin Keuntungan',
            profitDiff: 'Perbedaan antara harga klien dan agen',
            saveConfig: 'Simpan Konfigurasi',
            reset: 'Reset',
            customPricing: 'Harga Kustom',
            customPriceDesc: 'Atur harga khusus untuk klien atau pemasok tertentu.',
            targetType: 'Tipe Target',
            selectAccount: 'Pilih Akun',
            customPrice: 'Harga Kustom (per GEN)',
            action: 'Aksi',
            setCustomPrice: 'Atur Harga Kustom',
            usingDefault: 'Menggunakan default',
            preferences: 'Preferensi',
            currency: 'Mata Uang',
            measurementUnit: 'Unit Pengukuran',
            language: 'Bahasa',
            dateFormat: 'Format Tanggal',
            savePrefs: 'Simpan Preferensi',
            litersOnly: 'Hanya Liter',
            leaveBlank: 'Kosongkan untuk default',
            deleteDatabase: 'Hapus Database',
            deleteScope: 'Pilih data untuk dihapus',
            deleteTransactions: 'Transaksi',
            deleteAgents: 'Permintaan Agent',
            deleteClients: 'Permintaan Klien',
            deleteInventory: 'Inventaris',
            deleteDateRange: 'Rentang tanggal',
            deleteToday: 'Hari Ini',
            deleteWeek: 'Minggu Ini',
            deleteMonth: 'Bulan Ini',
            deleteLastMonth: 'Bulan Lalu',
            deleteAll: 'Seluruh Data (tanpa filter tanggal)',
            deleteCustomRange: 'Rentang kustom',
            deleteFrom: 'Dari',
            deleteTo: 'Sampai',
            deleteBtn: 'Hapus Database',
            deleteConfirm1: 'PERINGATAN: Ini akan menghapus data yang dipilih secara permanen dari database dan browser. Tindakan ini tidak dapat dibatalkan.',
            deleteConfirm2: 'Ketik HAPUS untuk konfirmasi penghapusan permanen',
            deleteSuccess: 'Data berhasil dihapus',
            deleteError: 'Gagal menghapus data',
            deleteCancelled: 'Penghapusan dibatalkan',
            deleteUsers: 'Pengguna'
        },
        alerts: {
            settingsSaved: 'Pengaturan berhasil disimpan!',
            newProfitMargin: 'Margin Keuntungan Baru: Rp',
            settingsReset: 'Pengaturan dikembalikan ke nilai default',
            customPriceSaved: 'Harga kustom berhasil disimpan!',
            customPriceCleared: 'Harga kustom dihapus.',
            prefsSaved: 'Preferensi berhasil disimpan!',
            addTransaction: 'Tambah Transaksi',
            addAgent: 'Tambah Agen Baru',
            addClient: 'Tambah Klien Baru',
            addUser: 'Tambah Pengguna Baru',
            agentRequestSubmitted: 'Permintaan Agen Terkirim!',
            confirmWarn: 'Anda yakin?',
            invalidQty: 'Silakan masukkan kuantitas yang valid.',
            logoutConfirm: 'Apakah Anda yakin ingin keluar?',
            filterAll: 'Semua',
            filterByStatus: 'Filter berdasarkan Status',
            filterByType: 'Filter berdasarkan Tipe',
            filterClear: 'Hapus',
            viewDetails: 'Lihat Detail',
            payAgent: 'Bayar Agen',
            noData: 'Tidak ada data.',
            searchPlaceholder: 'Cari...',
            orderSubmitted: 'Permintaan pesanan terkirim!',
            genRequestSubmitted: 'Permintaan GEN terkirim!',
            insufficientDiesel: 'Diesel tidak mencukupi.',
            week: 'Minggu Ini',
            month: 'Bulan Ini',
            lastMonth: 'Bulan Lalu',
            today: 'Hari Ini',
            fulfilled: 'Terpenuhi',
            unfulfilled: 'Belum Terpenuhi',
            dieselCost: 'Biaya Diesel',
            deleteConfirm: 'Yakin ingin menghapus item ini? Tindakan ini tidak dapat dibatalkan.',
            deleteItem: 'Hapus'
        }
    }
};

// ========================
// UTILITY FUNCTIONS
// ========================
function t(key) {
    const lang = state.preferences.language || 'id';
    const keys = key.split('.');
    let result = translations[lang];
    for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (result && typeof result === 'object' && k in result) {
            result = result[k];
        } else {
            result = null;
            break;
        }
    }
    if (result === null || result === undefined) {
        result = translations.en;
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            if (result && typeof result === 'object' && k in result) {
                result = result[k];
            } else {
                result = key;
                break;
            }
        }
    }
    return result !== undefined && result !== null ? result : key;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text || '');
    return div.innerHTML;
}

function formatCurrency(amount) {
    if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '0';
    return new Intl.NumberFormat('id-ID').format(num);
}

function formatThousandsInput(input) {
    let value = input.value.replace(/\./g, '');
    if (value === '') return;
    if (!/^\d+$/.test(value)) return;
    input.value = new Intl.NumberFormat('id-ID').format(parseInt(value, 10));
}

function parseThousands(value) {
    if (!value) return 0;
    const num = parseFloat(value.replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(/,/, '.'));
    return isNaN(num) ? 0 : num;
}

function getAgentRequestAmount(genQty) {
    return genQty * state.prices.agentPricePerGen;
}

function getDieselCostForGen() {
    return state.prices.dieselPricePerLiter * state.prices.litersPerGen;
}

function getAgentProfitPerGen() {
    return state.prices.agentPricePerGen - getDieselCostForGen();
}

function getClientPriceFor(clientName) {
    return state.customPrices[clientName] || state.prices.clientPricePerGen;
}

function getAgentPriceFor(agentName) {
    return state.customPrices[agentName] || state.prices.agentPricePerGen;
}

function getSupplierPriceFor(supplierName) {
    return state.customPrices[supplierName] || state.prices.supplierPricePerGen;
}

function getNavItemsForRole(role) {
    if (role === 'admin') return ['dashboard', 'transactions', 'agents', 'clients', 'inventory', 'reports', 'users', 'settings'];
    if (role === 'client') return ['dashboard', 'requestOrder'];
    if (role === 'agent') return ['dashboard', 'requestGen'];
    return ['dashboard'];
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('sidebar-overlay').classList.toggle('active');
}

// ========================
// MODAL FUNCTIONS
// ========================
function showAddModal(title, fields, buttons) {
    document.getElementById('modal-title').textContent = title;
    let html = '<div style="display: flex; flex-direction: column; gap: 0.75rem;">';
    for (let i = 0; i < fields.length; i++) {
        const f = fields[i];
        html += '<div style="display: flex; flex-direction: column; gap: 0.3rem;">';
        html += '<label style="font-size: 0.8rem; color: var(--text-tertiary); font-weight: 500;">' + f.label + '</label>';
        if (f.type === 'textarea') {
            html += '<textarea class="input-field" id="' + f.id + '" placeholder="' + (f.placeholder || '') + '" rows="3">' + (f.value || '') + '</textarea>';
        } else if (f.type === 'select') {
            html += '<select class="input-field" id="' + f.id + '">';
            for (let j = 0; j < f.options.length; j++) {
                const selected = f.value && f.value === f.options[j].value ? 'selected' : '';
                html += '<option value="' + f.options[j].value + '" ' + selected + '>' + f.options[j].label + '</option>';
            }
            html += '</select>';
        } else {
            html += '<input type="' + (f.type || 'text') + '" class="input-field" id="' + f.id + '" placeholder="' + (f.placeholder || '') + '" value="' + (f.value || '') + '" min="0" inputmode="numeric" pattern="[0-9.]*" data-input="' + (f.type === 'text' && f.id && (f.id.indexOf('qty') > -1 || f.id.indexOf('rate') > -1 || f.id.indexOf('amount') > -1 || f.id.indexOf('price') > -1) ? 'formatThousandsInput(this)' : '') + '">';
        }
        html += '</div>';
    }
    html += '</div>';
    document.getElementById('modal-body').innerHTML = html;

    let footer = '';
    if (buttons) {
        footer = buttons;
    } else {
        footer = '<button class="btn btn-secondary" data-action="closeAddModal">' + t('alerts.filterClear') + '</button>';
        footer += '<button class="btn btn-primary" data-action="submitAddModal">Submit</button>';
    }
    document.getElementById('modal-footer').innerHTML = footer;

    document.getElementById('add-modal-overlay').classList.add('active');
    document.body.classList.add('body-scroll-lock');
    state.activeModal = { title: title };
}

function closeAddModal() {
    document.getElementById('add-modal-overlay').classList.remove('active');
    document.body.classList.remove('body-scroll-lock');
    state.activeModal = null;
}

function submitAddModal() {
    closeAddModal();
}

// ========================
// SIDEBAR & NAVIGATION
// ========================
function renderSidebar() {
    const navIcons = {
        dashboard: '🏠',
        transactions: '💳',
        agents: '🚛',
        clients: '👥',
        inventory: '⛽',
        reports: '📊',
        users: '⚙️',
        settings: '🔧',
        requestOrder: '📝',
        requestGen: '📝'
    };
    const allowedPages = state.loggedIn ? getNavItemsForRole(state.currentUser.role) : [];
    const nav = allowedPages.map(function(page) {
        const icon = navIcons[page] || '•';
        const active = state.currentPage === page ? 'active' : '';
        return '<li class="nav-item"><a href="#" class="nav-link ' + active + '" data-action="navigateTo" data-args="\'' + page + '\'"><span class="nav-icon">' + icon + '</span><span class="nav-text">' + t('nav.' + page) + '</span></a></li>';
    }).join('');
    document.getElementById('nav-menu').innerHTML = nav;
}

function navigateTo(page) {
    const allowedPages = getNavItemsForRole(state.currentUser.role);
    if (allowedPages.indexOf(page) === -1) {
        state.currentPage = 'dashboard';
    } else {
        state.currentPage = page;
    }
    updateNav();
    renderSidebar();
    renderPage();
}

function updateNav() {
    document.getElementById('profile-dropdown').classList.remove('show');
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebar-overlay').classList.remove('active');

    const titles = {
        'dashboard': { title: t('titles.dashboard'), subtitle: t('titles.dashboard_sub') },
        'transactions': { title: t('titles.transactions'), subtitle: t('titles.transactions_sub') },
        'agents': { title: t('titles.agents'), subtitle: t('titles.agents_sub') },
        'clients': { title: t('titles.clients'), subtitle: t('titles.clients_sub') },
        'inventory': { title: t('titles.inventory'), subtitle: t('titles.inventory_sub') },
        'reports': { title: t('titles.reports'), subtitle: t('titles.reports_sub') },
        'users': { title: t('titles.users'), subtitle: state.currentUser.role === 'admin' ? t('titles.users_sub_admin') : t('titles.users_sub_notadmin') },
        'settings': { title: t('titles.settings'), subtitle: t('titles.settings_sub') },
        'requestOrder': { title: t('titles.requestOrder'), subtitle: t('titles.requestOrder_sub') },
        'requestGen': { title: t('titles.requestGen'), subtitle: t('titles.requestGen_sub') },
        'login': { title: t('login.title'), subtitle: t('login.subtitle') }
    };

    const titleInfo = titles[state.currentPage] || titles.dashboard;
    document.getElementById('page-title').textContent = titleInfo.title;
    document.getElementById('page-subtitle').textContent = titleInfo.subtitle;

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(function(link) { link.classList.remove('active'); });
    const activeLink = document.querySelector('.nav-link[data-action="navigateTo(\'' + state.currentPage + '\'"]');
    if (activeLink) activeLink.classList.add('active');
}

function switchUser(userType) {
    if (userType === 'admin') {
        state.currentUser.role = 'admin';
        state.currentUser.name = 'Faisal Ahmad';
        state.currentUser.avatar = 'F';
    } else if (userType === 'client') {
        state.currentUser.role = 'client';
        state.currentUser.name = 'City Garage';
        state.currentUser.avatar = 'C';
    } else if (userType === 'agent') {
        state.currentUser.role = 'agent';
        state.currentUser.name = 'Ahmed Traders';
        state.currentUser.avatar = 'A';
    }

    document.getElementById('user-name').textContent = state.currentUser.name;
    document.getElementById('user-role').textContent = state.currentUser.role.charAt(0).toUpperCase() + state.currentUser.role.slice(1);
    document.getElementById('user-avatar').textContent = state.currentUser.avatar;

    document.getElementById('profile-dropdown').classList.remove('show');
    state.currentPage = 'dashboard';
    updateNav();
    renderSidebar();
    renderPage();
}

async function logout() {
    // tear down live SSE subscriptions so the session fully ends (no leaked listeners)
    realtimeSources.forEach(function(es) { try { es.close(); } catch (e2) {} });
    realtimeSources = [];
    // optimistic: end the session in the UI now, do NOT block on the network
    state.loggedIn = false;
    state.currentPage = 'login';
    state.currentUser = { id: null, username: null, name: 'Guest', role: '', avatar: '?' };
    saveToLocalStorage();
    updateHeader();
    renderSidebar();
    renderPage();
    updateNav();
    // best-effort: ask the server to clear the session cookie
    try { await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }); } catch (e) {}
}

function logoutWithConfirm() {
    if (confirm(t('alerts.logoutConfirm') + '\n\nApakah Anda yakin?')) {
        logout();
    }
}

function toggleProfileDropdown() {
    document.getElementById('profile-dropdown').classList.toggle('show');
}

function updateHeader() {
    const u = state.currentUser || {};
    document.getElementById('user-name').textContent = u.name || 'Guest';
    document.getElementById('user-role').textContent = u.role ? (u.role.charAt(0).toUpperCase() + u.role.slice(1)) : 'Not logged in';
    document.getElementById('user-avatar').textContent = u.avatar || '?';
}

function renderLogin() {
    return '<div class="login-wrapper"><div class="login-card"><div class="login-header"><div class="logo-icon">⛽</div><h2>' + t('login.title') + '</h2><div class="login-subtitle">' + t('login.subtitle') + '</div></div><div class="login-body">' +
        '<div class="form-group"><label class="form-label">' + t('login.username') + '</label><input class="input-field" type="text" id="login-username" autocomplete="off" placeholder="' + t('login.usernameHint') + '"></div>' +
        '<div class="form-group"><label class="form-label">' + t('login.password') + '</label><input class="input-field" type="password" id="login-password" autocomplete="off" placeholder="' + t('login.passwordHint') + '"></div>' +
        '<button class="btn btn-primary login-btn" data-action="loginUser">' + t('login.button') + '</button>' +
        '<div class="login-error" id="login-error"></div>' +
        '</div><div class="login-footer">' + t('login.hint') + '</div></div></div>';
}

async function loginUser() {
    const username = (document.getElementById('login-username').value || '').trim();
    const password = document.getElementById('login-password').value;
    const err = document.getElementById('login-error');
    if (err) err.textContent = '';
    if (!username || !password) { if (err) err.textContent = t('login.errorEmpty'); return; }
    try {
        const resp = await fetch('/api/login', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, password: password })
        });
        const data = await resp.json();
        if (!data.ok || !data.user) {
            if (err) err.textContent = t('login.error');
            if (document.getElementById('login-password')) document.getElementById('login-password').value = '';
            return;
        }
        state.currentUser = data.user;                       // server sends user (no password_hash)
        state.loggedIn = true;
        state.currentPage = 'dashboard';
        if (data.user.role === 'admin') { await fetchUsers(); }
        await syncRemote();
        subscribeRealtime();
        saveToLocalStorage();
        updateHeader();
        renderSidebar();
        renderPage();
        updateNav();
    } catch (e) {
        if (err) err.textContent = t('login.error');
    }
}

function renderPage() {
    if (!state.loggedIn) {
        document.getElementById('page-title').textContent = t('login.title');
        document.getElementById('page-subtitle').textContent = '';
        document.getElementById('content-area').innerHTML = renderLogin();
        return;
    }
    const allowedPages = getNavItemsForRole(state.currentUser.role);
    if (allowedPages.indexOf(state.currentPage) === -1) {
        state.currentPage = 'dashboard';
    }
    const contentArea = document.getElementById('content-area');
    switch(state.currentPage) {
        case 'dashboard': contentArea.innerHTML = renderDashboard(); break;
        case 'transactions': contentArea.innerHTML = renderTransactions(); break;
        case 'agents': contentArea.innerHTML = renderAgents(); break;
        case 'clients': contentArea.innerHTML = renderClients(); break;
        case 'inventory': contentArea.innerHTML = renderInventory(); break;
        case 'reports': contentArea.innerHTML = renderReports(); break;
        case 'users': contentArea.innerHTML = renderUsers(); break;
        case 'settings': contentArea.innerHTML = renderSettings(); setupDeleteDateRangeToggle(); break;
        case 'requestOrder': contentArea.innerHTML = renderRequestOrder(); break;
        case 'requestGen': contentArea.innerHTML = renderRequestGen(); break;
        default: contentArea.innerHTML = renderDashboard();
    }
}

// ========================
// DASHBOARD
// ========================
function renderDashboard() {
    if (state.currentUser.role === 'admin') { return renderAdminDashboard(); }
    if (state.currentUser.role === 'client') { return renderClientDashboard(); }
    if (state.currentUser.role === 'agent') { return renderAgentDashboard(); }
    return renderAdminDashboard();
}

function renderAdminDashboard() {
    const totalSales = state.transactions.filter(function(tr) { return tr.type === 'sale'; }).reduce(function(sum, tr) { return sum + tr.amount; }, 0);
    const totalPurchases = state.transactions.filter(function(tr) { return tr.type === 'purchase'; }).reduce(function(sum, tr) { return sum + tr.amount; }, 0);
    const totalProfit = totalSales - totalPurchases;
    const profitMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : '0.0';
    const purchasesPct = totalSales > 0 ? ((totalPurchases / totalSales) * 100).toFixed(1) : '0.0';
    const usedGen = state.inventory.usedGen || 0;
    const availGen = state.inventory.availGen || 0;
    const totalGen = state.inventory.totalGen || 0;
    const dieselUtil = totalGen > 0 ? ((usedGen / totalGen) * 100).toFixed(1) : '0.0';

    return `<div class="widgets-grid">
        <div class="widget"><div class="widget-header"><span class="widget-title">${t('dashboard.totalSales')}</span>📈</div><div class="widget-value">${formatCurrency(totalSales)}</div><div class="widget-change change-positive">↗ ${profitMargin}% ${t('dashboard.netMargin')}</div></div>
        <div class="widget"><div class="widget-header"><span class="widget-title">${t('dashboard.totalPurchases')}</span>📉</div><div class="widget-value">${formatCurrency(totalPurchases)}</div><div class="widget-change change-positive">↘ ${purchasesPct}% ${t('dashboard.ofSales')}</div></div>
        <div class="widget"><div class="widget-header"><span class="widget-title">${t('dashboard.netProfit')}</span>💰</div><div class="widget-value text-green">${formatCurrency(totalProfit)}</div><div class="widget-change change-positive">↗ ${profitMargin}% ${t('dashboard.netMargin')}</div></div>
        <div class="widget"><div class="widget-header"><span class="widget-title">${t('dashboard.availDiesel')}</span>⛽</div><div class="widget-value">${formatNumber(state.inventory.availGen)} GEN</div><div class="widget-change change-negative">↓ ${dieselUtil}% ${t('dashboard.used')}</div></div>
    </div>
    <div class="table-container">
        <div class="table-header"><div class="table-title">${t('dashboard.recentTrans')}</div><div class="table-actions"><button class="btn btn-secondary btn-sm" data-action="navigateTo" data-args="'transactions'">${t('dashboard.viewAll')}</button></div></div>
        <div class="table-scrollable"><table>
            <thead><tr><th>${t('table.date')}</th><th>${t('table.type')}</th><th>${t('table.counterparty')}</th><th>${t('table.quantity')}</th><th>${t('table.rate')}</th><th>${t('table.amount')}</th><th>${t('table.status')}</th></tr></thead>
            <tbody>${state.transactions.slice(0, 5).map(function(tr) {
                return '<tr><td>' + tr.date + '</td><td><span class="text-' + (tr.type === 'sale' ? 'green' : 'yellow') + '">' + (tr.type === 'sale' ? t('reports.sale') : t('reports.purchase')) + '</span></td><td>' + escapeHtml(tr.counterparty) + '</td><td>' + tr.qty + ' ' + tr.unit + '</td><td>' + formatCurrency(tr.rate) + '</td><td>' + formatCurrency(tr.amount) + '</td><td><span class="status-badge status-' + tr.status + '">' + tr.status + '</span></td></tr>';
            }).join('')}</tbody>
        </table></div>
    </div>`;
}

function renderClientDashboard() {
    const clientName = state.currentUser.name;
    const clientTrans = state.transactions.filter(function(tr) { return tr.counterparty === clientName; });
    const totalPurchased = clientTrans.filter(function(tr) { return tr.type === 'sale'; }).reduce(function(sum, tr) { return sum + tr.amount; }, 0);
    const genPurchased = clientTrans.reduce(function(sum, tr) { return sum + tr.qty; }, 0);
    const clientObj = state.clients.find(function(c) { return c.name === clientName; }) || { balance: 0 };
    const pricePerGen = getClientPriceFor(clientName);
    const availGen = state.inventory.availGen || 0;
    const maxGenFromBalance = clientObj.balance > 0 ? Math.floor(clientObj.balance / pricePerGen) : 0;
    const orderableGen = Math.min(availGen, maxGenFromBalance);
    const quotaPercent = availGen > 0 ? Math.min(100, Math.round((orderableGen / availGen) * 100)) : 0;

    return `<div class="widgets-grid">
        <div class="widget"><div class="widget-header"><span class="widget-title">${t('dashboard.totalPurchased')}</span>💰</div><div class="widget-value">${formatCurrency(totalPurchased)}</div><div class="widget-change change-positive">${formatNumber(genPurchased)} GEN ${t('clients.purchasedGen')}</div></div>
        <div class="widget"><div class="widget-header"><span class="widget-title">${t('dashboard.availableDieselQuota')}</span>⛽</div><div class="widget-value">${formatNumber(orderableGen)} GEN</div><div class="widget-change change-positive">${quotaPercent}% ${t('dashboard.currentOrderProgress')}</div></div>
        <div class="widget"><div class="widget-header"><span class="widget-title">${t('agents.balance')}</span>💳</div><div class="widget-value">${formatCurrency(clientObj.balance)}</div><div class="widget-change">${formatCurrency(pricePerGen)} / GEN</div></div>
    </div>
    <div class="table-container">
        <div class="table-header"><div class="table-title">${t('dashboard.myTransactions')}</div></div>
        <div class="table-scrollable"><table>
            <thead><tr><th>${t('table.date')}</th><th>${t('table.type')}</th><th>${t('table.quantity')}</th><th>${t('table.amount')}</th><th>${t('table.status')}</th></tr></thead>
            <tbody>${clientTrans.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);padding:2rem;">' + t('alerts.noData') + '</td></tr>' : clientTrans.map(function(tr) {
                return '<tr><td>' + tr.date + '</td><td><span class="text-' + (tr.type === 'sale' ? 'green' : 'yellow') + '">' + (tr.type === 'sale' ? t('reports.sale') : t('reports.purchase')) + '</span></td><td>' + tr.qty + ' GEN</td><td>' + formatCurrency(tr.amount) + '</td><td><span class="status-badge status-' + tr.status + '">' + tr.status + '</span></td></tr>';
            }).join('')}</tbody>
        </table></div>
    </div>`;
}

function renderAgentDashboard() {
    const agentName = state.currentUser.name;
    const agentTrans = state.transactions.filter(function(tr) { return tr.counterparty === agentName; });
    const dieselCostPerGen = getDieselCostForGen();
    const profitPerGen = getAgentProfitPerGen();
    const completedGen = agentTrans.filter(function(tr) { return tr.type === 'purchase' && tr.status === 'completed'; }).reduce(function(sum, tr) { return sum + tr.qty; }, 0);
    const totalProfit = completedGen * profitPerGen;
    const agentObj = state.agents.find(function(a) { return a.name === agentName; }) || { genQty: 0, dieselProvided: 0 };
    const dieselProvided = agentObj.dieselProvided || (agentObj.genQty * state.prices.litersPerGen);
    const targetGen = agentObj.genQty || 0;
    const remainingGen = Math.max(0, targetGen - completedGen);
    const fulfillmentPercent = targetGen > 0 ? Math.round((completedGen / targetGen) * 100) : 0;
    const dieselProvidedLiters = dieselProvided;
    const dieselProvidedGens = Math.floor(dieselProvidedLiters / state.prices.litersPerGen);

    return `<div class="widgets-grid">
        <div class="widget"><div class="widget-header"><span class="widget-title">${t('dashboard.myProfit')}</span>💰</div><div class="widget-value text-green">${formatCurrency(totalProfit)}</div><div class="widget-change change-positive">${formatCurrency(profitPerGen)} / GEN (${dieselCostPerGen} ${t('table.rate')} ${formatCurrency(state.prices.dieselPricePerLiter)}/L)</div></div>
        <div class="widget"><div class="widget-header"><span class="widget-title">${t('dashboard.dieselProvided')}</span>⛽</div><div class="widget-value">${formatNumber(dieselProvidedLiters)} L</div><div class="widget-change change-positive">${formatNumber(dieselProvidedGens)} GEN</div></div>
        <div class="widget"><div class="widget-header"><span class="widget-title">${t('dashboard.quotaToFulfill')}</span>📊</div><div class="widget-value text-yellow">${formatNumber(remainingGen)} GEN</div><div class="widget-change change-positive">${completedGen} / ${targetGen} GEN (${fulfillmentPercent}%)</div></div>
    </div>
    <div class="table-container">
        <div class="table-header"><div class="table-title">${t('dashboard.myTransactions')}</div><div class="table-actions"><button class="btn btn-secondary btn-sm" data-action="navigateTo" data-args="'requestGen'">${t('agents.sendRequest')}</button></div></div>
        <div class="table-scrollable"><table>
            <thead><tr><th>${t('table.date')}</th><th>${t('table.type')}</th><th>${t('table.quantity')}</th><th>${t('table.amount')}</th><th>${t('table.status')}</th></tr></thead>
            <tbody>${agentTrans.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);padding:2rem;">' + t('alerts.noData') + '</td></tr>' : agentTrans.map(function(tr) {
                return '<tr><td>' + tr.date + '</td><td><span class="text-' + (tr.type === 'sale' ? 'green' : 'yellow') + '">' + (tr.type === 'sale' ? t('reports.sale') : t('reports.purchase')) + '</span></td><td>' + tr.qty + ' GEN</td><td>' + formatCurrency(tr.amount) + '</td><td><span class="status-badge status-' + tr.status + '">' + tr.status + '</span></td></tr>';
            }).join('')}</tbody>
        </table></div>
    </div>`;
}

// ========================
// TRANSACTIONS PAGE
// ========================
function renderTransactions() {
    const isClientOrAgent = state.currentUser.role !== 'admin';
    const transFilter = state.transFilter || 'all';
    let filteredTrans = filterTransactionsByDate(state.transactions, transFilter);

    if (isClientOrAgent) {
        filteredTrans = filteredTrans.filter(function(tr) {
            return tr.counterparty === state.currentUser.name;
        });
    }

    // Apply type/status filters
    const typeFilter = document.getElementById('filter-trans-type') ? document.getElementById('filter-trans-type').value : '';
    const statusFilter = document.getElementById('filter-trans-status') ? document.getElementById('filter-trans-status').value : '';

    if (typeFilter) filteredTrans = filteredTrans.filter(function(tr) { return tr.type === typeFilter; });
    if (statusFilter) filteredTrans = filteredTrans.filter(function(tr) { return tr.status === statusFilter; });

    const addButton = isClientOrAgent ? '' : '<button class="btn btn-primary btn-sm" data-action="showAddTransactionModal">+ ' + t('alerts.addTransaction') + '</button>';
    const filterSection = isClientOrAgent ? '' : `
        <div class="filter-bar">
            <div class="form-group"><label class="form-label">${t('alerts.filterByType')}</label><select class="input-field" id="filter-trans-type" data-change="filterTransactions"><option value="">${t('alerts.filterAll')}</option><option value="sale">${t('reports.sale')}</option><option value="purchase">${t('reports.purchase')}</option></select></div>
            <div class="form-group"><label class="form-label">${t('alerts.filterByStatus')}</label><select class="input-field" id="filter-trans-status" data-change="filterTransactions"><option value="">${t('alerts.filterAll')}</option><option value="completed">Completed</option><option value="pending">${t('agents.due')}</option></select></div>
            <div class="form-group"><label class="form-label">${t('reports.dateRange')}</label><select class="input-field" id="filter-trans-date" data-change="filterTransactions"><option value="all" ${transFilter === 'all' ? 'selected' : ''}>${t('reports.allData')}</option><option value="week" ${transFilter === 'week' ? 'selected' : ''}>${t('alerts.week')}</option><option value="month" ${transFilter === 'month' ? 'selected' : ''}>${t('alerts.month')}</option><option value="last_month" ${transFilter === 'last_month' ? 'selected' : ''}>${t('alerts.lastMonth')}</option><option value="today" ${transFilter === 'today' ? 'selected' : ''}>${t('alerts.today')}</option></select></div>
            <button class="btn btn-secondary btn-sm" data-action="clearTransactionFilters">${t('alerts.filterClear')}</button>
        </div>`;

    return `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem;"><h2 style="font-size: 1.3rem; color: var(--white);">${t('titles.transactions')}</h2>${addButton}</div>
        ${filterSection}
        <div class="table-container"><div class="table-scrollable"><table>
            <thead><tr><th>${t('table.date')}</th><th>${t('table.type')}</th><th>${t('table.counterparty')}</th><th>${t('table.quantity')}</th><th>${t('table.unit')}</th><th>${t('table.ratePerGen')}</th><th>${t('table.amount')}</th><th>${t('table.status')}</th>${!isClientOrAgent ? '<th>' + t('table.actions') + '</th>' : ''}</tr></thead>
            <tbody id="transactions-tbody">${filteredTrans.map(function(tr) {
                return '<tr><td>' + tr.date + '</td><td><span class="text-' + (tr.type === 'sale' ? 'green' : 'yellow') + '">' + (tr.type === 'sale' ? '🔼 ' + t('reports.sale') : '🔽 ' + t('reports.purchase')) + '</span></td><td>' + escapeHtml(tr.counterparty) + '</td><td>' + formatNumber(tr.qty) + '</td><td>' + tr.unit + '</td><td>' + formatCurrency(tr.rate) + '</td><td>' + formatCurrency(tr.amount) + '</td><td><span class="status-badge status-' + tr.status + '">' + tr.status + '</span></td>' + (!isClientOrAgent ? '<td><button class="btn btn-secondary btn-xs" data-action="editTransaction" data-args="' + tr.id + '">' + t('users.edit') + '</button><button class="btn btn-danger btn-xs" data-action="deleteTransaction" data-args="' + tr.id + '">' + t('alerts.deleteItem') + '</button></td>' : '') + '</tr>';
            }).join('')}</tbody>
        </table></div></div>`;
}

function showAddTransactionModal() {
    const fields = [
        { label: t('alerts.filterByType'), id: 'trans-type', type: 'select', options: [{ value: 'sale', label: t('reports.sale') }, { value: 'purchase', label: t('reports.purchase') }] },
        { label: 'Counterparty', id: 'trans-counterparty', type: 'text', placeholder: 'Client/Agent/Supplier name' },
        { label: t('table.quantity'), id: 'trans-qty', type: 'number', placeholder: 'Enter quantity' },
        { label: t('table.ratePerGen'), id: 'trans-rate', type: 'number', placeholder: 'Enter rate' },
        { label: t('table.status'), id: 'trans-status', type: 'select', options: [{ value: 'completed', label: t('users.active') }, { value: 'pending', label: t('agents.due') }, { value: 'cancelled', label: 'Cancelled' }] },
        { label: t('table.date'), id: 'trans-date', type: 'date' }
    ];
    const footerHtml = '<button class="btn btn-secondary" data-action="closeAddModal">' + t('alerts.filterClear') + '</button><button class="btn btn-primary" data-action="submitAddTransaction">' + t('alerts.addTransaction') + '</button>';
    showAddModal(t('alerts.addTransaction'), fields, footerHtml);
}

async function submitAddTransaction() {
    const type = document.getElementById('trans-type').value;
    const counterparty = document.getElementById('trans-counterparty').value;
    const qty = parseInt(document.getElementById('trans-qty').value);
    const rate = parseFloat(document.getElementById('trans-rate').value);
    const status = document.getElementById('trans-status').value;
    const date = document.getElementById('trans-date').value;

    if (!counterparty || !qty || !rate) { alert(t('alerts.invalidQty')); return; }

    const amount = qty * rate;
    const txDate = date || new Date().toISOString().split('T')[0];
    const serverTx = await postRealtime('/api/transactions', { type: type, counterparty: counterparty, qty: qty, unit: 'gen', rate: rate, amount: amount, status: status, date: txDate });
    const txId = (serverTx && serverTx.transaction && serverTx.transaction.id) || Date.now();
    state.transactions.push({ id: txId, type: type, counterparty: counterparty, qty: qty, unit: 'gen', rate: rate, amount: amount, status: status, date: txDate });
    saveToLocalStorage();
    closeAddModal();
    renderPage();
}

function editTransaction(id) {
    const tr = state.transactions.find(function(t2) { return t2.id === id; });
    if (!tr) { alert(t('alerts.noData')); return; }
    const fields = [
        { label: t('table.date'), id: 'edit-trans-date', type: 'date', value: tr.date },
        { label: t('alerts.filterByType'), id: 'edit-trans-type', type: 'select', options: [{ value: 'sale', label: t('reports.sale') }, { value: 'purchase', label: t('reports.purchase') }], value: tr.type },
        { label: 'Counterparty', id: 'edit-trans-counterparty', type: 'text', value: tr.counterparty },
        { label: t('table.quantity'), id: 'edit-trans-qty', type: 'text', value: formatNumber(tr.qty), placeholder: 'Enter quantity' },
        { label: t('table.ratePerGen'), id: 'edit-trans-rate', type: 'text', value: formatCurrency(tr.rate).replace('Rp ', ''), placeholder: 'Enter rate' },
        { label: t('table.status'), id: 'edit-trans-status', type: 'select', options: [{ value: 'completed', label: 'Completed' }, { value: 'pending', label: t('agents.due') }, { value: 'cancelled', label: 'Cancelled' }], value: tr.status }
    ];
    const footerHtml = '<button class="btn btn-secondary" data-action="closeAddModal">' + t('alerts.filterClear') + '</button><button class="btn btn-primary" data-action="saveTransactionEdit" data-args="' + tr.id + '">' + t('users.edit') + '</button>';
    showAddModal(t('alerts.viewDetails'), fields, footerHtml);
}

function saveTransactionEdit(id) {
    const tr = state.transactions.find(function(t2) { return t2.id === id; });
    if (!tr) { alert(t('alerts.noData')); return; }
    tr.date = document.getElementById('edit-trans-date').value;
    tr.type = document.getElementById('edit-trans-type').value;
    tr.counterparty = document.getElementById('edit-trans-counterparty').value;
    tr.qty = parseThousands(document.getElementById('edit-trans-qty').value);
    tr.rate = parseThousands(document.getElementById('edit-trans-rate').value);
    tr.status = document.getElementById('edit-trans-status').value;
    tr.amount = tr.qty * tr.rate;
    saveToLocalStorage();
    closeAddModal();
    renderPage();
}

function filterTransactions() {
    const typeFilter = document.getElementById('filter-trans-type') ? document.getElementById('filter-trans-type').value : '';
    const statusFilter = document.getElementById('filter-trans-status') ? document.getElementById('filter-trans-status').value : '';
    const dateFilter = document.getElementById('filter-trans-date') ? document.getElementById('filter-trans-date').value : 'all';
    state.transFilter = dateFilter;

    let filtered = filterTransactionsByDate(state.transactions, dateFilter);
    if (typeFilter) filtered = filtered.filter(function(tr) { return tr.type === typeFilter; });
    if (statusFilter) filtered = filtered.filter(function(tr) { return tr.status === statusFilter; });
    const tbody = document.getElementById('transactions-tbody');
    if (tbody) {
        tbody.innerHTML = filtered.map(function(tr) {
            return '<tr><td>' + tr.date + '</td><td><span class="text-' + (tr.type === 'sale' ? 'green' : 'yellow') + '">' + (tr.type === 'sale' ? '🔼 ' + t('reports.sale') : '🔽 ' + t('reports.purchase')) + '</span></td><td>' + escapeHtml(tr.counterparty) + '</td><td>' + formatNumber(tr.qty) + '</td><td>' + tr.unit + '</td><td>' + formatCurrency(tr.rate) + '</td><td>' + formatCurrency(tr.amount) + '</td><td><span class="status-badge status-' + tr.status + '">' + tr.status + '</span></td><td><button class="btn btn-secondary btn-xs" data-action="editTransaction" data-args="' + tr.id + '">' + t('users.edit') + '</button><button class="btn btn-danger btn-xs" data-action="deleteTransaction" data-args="' + tr.id + '">' + t('alerts.deleteItem') + '</button></td></tr>';
        }).join('');
    }
}

function clearTransactionFilters() {
    if (document.getElementById('filter-trans-type')) document.getElementById('filter-trans-type').value = '';
    if (document.getElementById('filter-trans-status')) document.getElementById('filter-trans-status').value = '';
    if (document.getElementById('filter-trans-date')) document.getElementById('filter-trans-date').value = 'all';
    state.transFilter = 'all';
    renderPage();
}

// ========================
// AGENTS PAGE
// ========================
function renderAgents() {
    const totalAgentGen = state.agents.reduce(function(sum, ag) { return sum + ag.genQty; }, 0);
    const avgRate = state.prices.agentPricePerGen;
    const totalAgentCost = totalAgentGen * avgRate;
    const dieselCostPerGen = getDieselCostForGen();
    const adminProfit = avgRate - dieselCostPerGen;

    return `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem;"><h2 style="font-size: 1.3rem; color: var(--white);">${t('agents.myAgents')}</h2><button class="btn btn-primary btn-sm" data-action="showAddAgentModal">+ ${t('agents.addAgent')}</button></div>
        <div class="widgets-grid" style="margin-bottom: 2rem;">
            <div class="widget"><div class="widget-header"><span class="widget-title">${t('agents.totalAgentDiesel')}</span>⛽</div><div class="widget-value">${formatNumber(totalAgentGen)} GEN</div></div>
            <div class="widget"><div class="widget-header"><span class="widget-title">${t('agents.avgRate')}</span>💰</div><div class="widget-value">${formatCurrency(avgRate)}</div><div class="widget-change">${t('agents.agentPays')}</div></div>
            <div class="widget"><div class="widget-header"><span class="widget-title">${t('dashboard.myProfit')}</span>💰</div><div class="widget-value text-green">${formatCurrency(totalAgentCost)}</div><div class="widget-change change-positive">${formatCurrency(adminProfit)} / GEN (${t('alerts.dieselCost')})</div></div>
        </div>

        ${state.currentUser.role === 'admin' ? renderAgentRequestsTable() : ''}

        <div class="table-container" style="margin-bottom: 2rem;">
            <div class="table-scrollable"><table>
                <thead><tr><th>${t('agents.agentName')}</th><th>${t('agents.genQty')}</th><th>${t('agents.litersQty')}</th><th>${t('agents.balance')}</th><th>${t('table.status')}</th><th>${t('table.actions')}</th></tr></thead>
                <tbody>${state.agents.map(function(agent) {
                    return '<tr><td>' + escapeHtml(agent.name) + '</td><td>' + formatNumber(agent.genQty) + ' GEN</td><td>' + formatNumber(agent.litersQty) + ' L</td><td class="' + (agent.balance > 0 ? 'text-yellow' : 'text-green') + '">' + (agent.balance > 0 ? formatCurrency(agent.balance) + ' (' + t('agents.due') + ')' : t('agents.paid')) + '</td><td><span class="status-badge status-' + agent.status + '">' + agent.status + '</span></td><td><button class="btn btn-secondary btn-xs" data-action="viewAgentDetails" data-args="' + agent.id + '">' + t('agents.view') + '</button>' + (agent.balance > 0 ? '<button class="btn btn-danger btn-xs" data-action="payAgent" data-args="' + agent.id + '">' + t('agents.pay') + '</button>' : '') + '</td></tr>';
                }).join('')}</tbody>
            </table></div>
        </div>

        <div class="card"><p style="color: var(--text-secondary); margin-bottom: 1rem;">${t('agents.selectAgent')} ${t('agents.requestQty')}</p>
            <div class="form-grid"><div class="form-group"><label class="form-label">${t('agents.requestQty')}</label><input type="text" class="input-field" id="agent-request-qty" placeholder="${t('agents.enterQty')}" data-input="formatThousandsInput" data-args="this" inputmode="numeric" pattern="[0-9.]*"></div><div class="form-group"><label class="form-label">${t('agents.selectAgent')}</label><select class="input-field" id="agent-select">${state.agents.map(function(a) { return '<option value="' + a.id + '">' + escapeHtml(a.name) + '</option>'; }).join('')}</select></div></div>
            <div class="form-actions"><button class="btn btn-primary" data-action="submitAgentRequest">${t('agents.sendRequest')}</button></div>
        </div>`;
}

function renderAgentRequestsTable() {
    state.agentRequests = state.agentRequests || [];
    if (state.agentRequests.length === 0) {
        return '<div class="card" style="margin-bottom: 2rem;"><h3 style="margin-bottom: 1rem; color: var(--white); font-size: 1.1rem;">' + t('agents.agentRequests') + '</h3><p style="color: var(--text-secondary); padding: 1rem;">' + t('alerts.noData') + '</p></div>';
    }

    const statusOrder = ['pending', 'approved', 'delivered', 'confirmed', 'verified', 'completed', 'rejected'];
    const sortedRequests = state.agentRequests.slice().sort(function(a, b) {
        return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
    });

    let tableHtml = '<div class="card" style="margin-bottom: 2rem;">';
    tableHtml += '<h3 style="margin-bottom: 1rem; color: var(--white); font-size: 1.1rem;">' + t('agents.agentRequests') + '</h3>';
    tableHtml += '<div class="table-scrollable"><table><thead><tr><th>' + t('agents.agentName') + '</th><th>' + t('agents.targetQty') + '</th><th>' + t('agents.deliveredQty') + '</th><th>' + t('agents.remainingToDeliver') + '</th><th>' + t('agents.requestedAmount') + '</th><th>' + t('table.status') + '</th><th>' + t('table.actions') + '</th></tr></thead><tbody>';

    sortedRequests.forEach(function(req) {
        const agent = state.agents.find(function(a) { return a.id === req.agentId; }) || { name: req.agentName };
        const prog = { target: req.genQty, delivered: req.deliveredQty || 0, remaining: Math.max(0, req.genQty - (req.deliveredQty || 0)) };
        const statusClass = 'status-' + req.status;
        const statusLabel = req.status === 'pending' ? t('agents.orderPending') : req.status === 'approved' ? t('agents.orderApproved') : req.status === 'delivered' ? t('agents.orderDelivered') : req.status === 'confirmed' ? t('agents.orderConfirmed') : req.status === 'verified' ? t('agents.verify') : req.status === 'completed' ? t('agents.orderComplete') : req.status === 'rejected' ? t('agents.rejected') : req.status;

        let actionsHtml = '';
        if (state.currentUser.role === 'admin') {
            if (req.status === 'pending') {
                actionsHtml = '<button class="btn btn-success btn-xs" data-action="approveAgentRequest" data-args="' + req.id + '">' + t('agents.approveAndPay') + '</button>';
            } else if (req.status === 'delivered') {
                actionsHtml = '<button class="btn btn-warning btn-xs" data-action="verifyAgentDelivery" data-args="' + req.id + '">' + t('agents.confirmGenDelivered') + '</button>';
            } else if (req.status === 'confirmed') {
                actionsHtml = '<button class="btn btn-primary btn-xs" data-action="verifyAgentFulfillment" data-args="' + req.id + '">' + t('agents.adminVerify') + '</button>';
            } else if (req.status === 'verified') {
                actionsHtml = '<button class="btn btn-success btn-xs" data-action="completeAgentOrder" data-args="' + req.id + '">' + t('agents.orderComplete') + '</button>';
            }
        } else if (state.currentUser.role === 'agent') {
            if (req.status === 'approved' && prog.delivered < prog.target) {
                actionsHtml = '<button class="btn btn-warning btn-xs" data-action="agentConfirmDelivery" data-args="' + req.id + '">' + t('agents.genDelivered') + '</button>';
            } else if (req.status === 'delivered' && prog.delivered < prog.target) {
                actionsHtml = '<button class="btn btn-warning btn-xs" data-action="agentConfirmDelivery" data-args="' + req.id + '">' + t('agents.genDelivered') + '</button>';
            }
        }
    actionsHtml += '<button class="btn btn-danger btn-xs" data-action="deleteAgentRequest" data-args="' + req.id + '">' + t('alerts.deleteItem') + '</button>';

        tableHtml += '<tr>';
        tableHtml += '<td>' + escapeHtml(agent.name) + '</td>';
        tableHtml += '<td>' + formatNumber(prog.target) + ' GEN</td>';
        tableHtml += '<td>' + formatNumber(prog.delivered) + ' GEN</td>';
        tableHtml += '<td>' + formatNumber(prog.remaining) + ' GEN</td>';
        tableHtml += '<td>' + formatCurrency(req.amount) + '</td>';
        tableHtml += '<td><span class="status-badge ' + statusClass + '">' + statusLabel + '</span></td>';
        tableHtml += '<td>' + actionsHtml + '</td>';
        tableHtml += '</tr>';
    });

    tableHtml += '</tbody></table></div></div>';
    return tableHtml;
}

function showAddAgentModal() {
    const fields = [
        { label: 'Nama / Nama Perusahaan', id: 'agent-name', type: 'text', placeholder: 'Masukkan nama' },
        { label: 'Nomor Telepon', id: 'agent-phone', type: 'tel', placeholder: 'Masukkan telepon' },
        { label: 'Email', id: 'agent-email', type: 'email', placeholder: 'Masukkan email' },
        { label: 'Alamat', id: 'agent-address', type: 'textarea', placeholder: 'Masukkan alamat' },
        { label: 'Tarif Komisi (opsional)', id: 'agent-commission', type: 'number', placeholder: 'Masukkan tarif %' }
    ];
    const footerHtml = '<button class="btn btn-secondary" data-action="closeAddModal">' + t('alerts.filterClear') + '</button><button class="btn btn-primary" data-action="submitAddAgent">' + t('agents.addAgent') + '</button>';
    showAddModal(t('alerts.addAgent'), fields, footerHtml);
}

function submitAddAgent() {
    const name = document.getElementById('agent-name').value;
    if (!name) { alert(t('alerts.invalidQty')); return; }
    state.agents.push({ id: Date.now(), name: name, genQty: 0, litersQty: 0, status: 'active', balance: 0, dieselProvided: 0 });
    saveToLocalStorage();
    closeAddModal();
    renderPage();
}

function viewAgentDetails(id) {
    const agent = state.agents.find(function(a) { return a.id === id; });
    if (!agent) { alert(t('alerts.noData')); return; }
    const agentReqs = (state.agentRequests || []).filter(function(r) { return r.agentId === id; });
    const totalProvided = agentReqs.filter(function(r) { return r.status === 'completed'; }).reduce(function(sum, r) { return sum + (r.deliveredQty || 0); }, 0);

    let reqsHtml = '';
    if (agentReqs.length > 0) {
        reqsHtml = '<hr style="border-color: var(--border-color);"><p style="color: var(--white); font-weight: bold; margin-bottom: 0.5rem;">' + t('agents.agentRequests') + '</p>';
        reqsHtml += '<div class="table-scrollable" style="margin-top: 0.5rem;"><table style="margin-bottom: 0;"><thead><tr><th>' + t('table.date') + '</th><th>' + t('agents.genQty') + '</th><th>' + t('agents.requestedAmount') + '</th><th>' + t('table.status') + '</th></tr></thead><tbody>';
        agentReqs.forEach(function(r) {
            const statusLabel = r.status === 'pending' ? t('agents.orderPending') : r.status === 'approved' ? t('agents.orderApproved') : r.status === 'delivered' ? t('agents.orderDelivered') : r.status === 'confirmed' ? t('agents.orderConfirmed') : r.status === 'verified' ? t('agents.verify') : r.status === 'completed' ? t('agents.orderComplete') : r.status === 'rejected' ? t('agents.rejected') : r.status;
            reqsHtml += '<tr><td>' + r.date + '</td><td>' + formatNumber(r.genQty) + ' GEN</td><td>' + formatCurrency(r.amount) + '</td><td><span class="status-badge status-' + r.status + '">' + statusLabel + '</span></td></tr>';
        });
        reqsHtml += '</tbody></table></div>';
    }

    const detailHtml = '<div style="display: flex; flex-direction: column; gap: 0.5rem;">' +
        '<p><strong>' + t('agents.agentName') + ':</strong> ' + escapeHtml(agent.name) + '</p>' +
        '<p><strong>' + t('agents.genQty') + ':</strong> ' + formatNumber(agent.genQty) + ' GEN</p>' +
        '<p><strong>' + t('agents.litersQty') + ':</strong> ' + formatNumber(agent.litersQty) + ' L</p>' +
        '<p><strong>' + t('agents.balance') + ':</strong> ' + (agent.balance > 0 ? formatCurrency(agent.balance) + ' (' + t('agents.due') + ')' : t('agents.paid')) + '</p>' +
        '<p><strong>' + t('table.status') + ':</strong> <span class="status-badge status-' + agent.status + '">' + agent.status + '</span></p>' +
        '<p><strong>' + t('agents.totalAgentDiesel') + ':</strong> ' + formatNumber(agent.genQty) + ' GEN</p>' +
        reqsHtml + '</div>';
    document.getElementById('modal-title').textContent = t('agents.view');
    document.getElementById('modal-body').innerHTML = detailHtml;
    document.getElementById('modal-footer').innerHTML = '<button class="btn btn-secondary" data-action="closeAddModal">' + t('alerts.filterClear') + '</button>';
    document.getElementById('add-modal-overlay').classList.add('active');
    document.body.classList.add('body-scroll-lock');
}

function payAgent(id) {
    const agent = state.agents.find(function(a) { return a.id === id; });
    if (!agent) { alert(t('alerts.noData')); return; }
    const fields = [
        { label: 'Nama Agen', id: 'pay-agent-name', type: 'text', placeholder: agent.name },
        { label: 'Jumlah', id: 'pay-agent-amount', type: 'text', placeholder: formatCurrency(agent.balance), oninput: 'formatThousandsInput(this)' },
        { label: 'Metode Pembayaran', id: 'pay-agent-method', type: 'select', options: [{ value: 'cash', label: 'Tunai' }, { value: 'transfer', label: 'Transfer Bank' }, { value: 'e-wallet', label: 'E-Wallet' }] },
        { label: 'Nomor Referensi', id: 'pay-agent-ref', type: 'text', placeholder: 'Masukkan referensi' }
    ];
    const footerHtml = '<button class="btn btn-secondary" data-action="closeAddModal">' + t('alerts.filterClear') + '</button><button class="btn btn-primary" data-action="submitAgentPayment" data-args="' + agent.id + '">' + t('agents.pay') + '</button>';
    showAddModal(t('alerts.payAgent'), fields, footerHtml);
}

function submitAgentPayment(agentId) {
    const amount = parseThousands(document.getElementById('pay-agent-amount').value);
    if (!amount || amount <= 0) { alert(t('alerts.invalidQty')); return; }
    const agent = state.agents.find(function(a) { return a.id === agentId; });
    if (agent) { agent.balance = Math.max(0, agent.balance - amount); saveToLocalStorage(); closeAddModal(); renderPage(); }
}

async function submitAgentRequest() {
    const qtyStr = document.getElementById('agent-request-qty').value;
    const qty = parseThousands(qtyStr);
    const agentId = parseInt(document.getElementById('agent-select').value);
    const agentName = document.getElementById('agent-select').options[document.getElementById('agent-select').selectedIndex].text;
    if (!qty || qty <= 0) { alert(t('alerts.invalidQty')); return; }
    const amount = getAgentRequestAmount(qty);
    state.agentRequests = state.agentRequests || [];
    const serverOrder = await postRealtime('/api/orders', { type: 'gen', requester_role: 'agent', counterparty: agentName, qty: qty, rate: state.prices.agentPricePerGen, amount: amount, requester_name: agentName });
    state.agentRequests.push({
        id: (serverOrder && serverOrder.order && serverOrder.order.id) || Date.now(),
        agentId: agentId,
        agentName: agentName,
        genQty: qty,
        amount: amount,
        status: 'pending',
        deliveredQty: 0,
        date: new Date().toISOString().split('T')[0],
        approvals: []
    });
    saveToLocalStorage();
    alert(t('alerts.agentRequestSubmitted') + '\n\n' + t('agents.selectAgent') + ': ' + agentName + '\n' + t('agents.requestQty') + ': ' + formatNumber(qty) + ' GEN\n' + t('agents.amountToPay') + ' ' + formatCurrency(amount));
    document.getElementById('agent-request-qty').value = '';
}

async function approveAgentRequest(reqId) {
    const req = state.agentRequests.find(function(r) { return r.id === reqId; });
    if (!req) return;
    if (!confirm(t('agents.approveRequest') + '\n\n' + t('agents.requestQty') + ': ' + formatNumber(req.genQty) + ' GEN\n' + t('agents.requestedAmount') + ': ' + formatCurrency(req.amount))) return;

    req.status = 'approved';
    req.approvals.push({ role: state.currentUser.role, action: 'approved', date: new Date().toISOString(), user: state.currentUser.name });
    await postOrderPatch(req.id, { status: 'approved' });
    saveToLocalStorage();
    renderPage();
}

async function agentConfirmDelivery(reqId) {
    const req = state.agentRequests.find(function(r) { return r.id === reqId; });
    if (!req) return;
    const prog = { target: req.genQty, delivered: req.deliveredQty || 0, remaining: Math.max(0, req.genQty - (req.deliveredQty || 0)) };
    if (prog.remaining <= 0) {
        alert(t('agents.allDelivered'));
        return;
    }
    const msg = t('agents.enterDeliveredQty') + '\\n\\n' + t('agents.targetQty') + ': ' + formatNumber(prog.target) + ' GEN\\n' + t('agents.deliveredQty') + ': ' + formatNumber(prog.delivered) + ' GEN\\n' + t('agents.remainingToDeliver') + ': ' + formatNumber(prog.remaining) + ' GEN';
    const deliveredStr = prompt(msg, String(prog.remaining));
    if (!deliveredStr) return;
    const delivered = parseThousands(deliveredStr);
    if (!delivered || delivered <= 0 || delivered > prog.remaining) {
        alert(t('alerts.invalidQty'));
        return;
    }
    req.deliveredQty = delivered;
    req.status = 'delivered';
    req.approvals.push({ role: state.currentUser.role, action: 'delivered', date: new Date().toISOString(), user: state.currentUser.name, qty: delivered });
    await postOrderPatch(req.id, { status: 'delivered', delivered_qty: delivered });
    saveToLocalStorage();
    renderPage();
}

async function verifyAgentDelivery(reqId) {
    const req = state.agentRequests.find(function(r) { return r.id === reqId; });
    if (!req) return;
    if (!confirm(t('agents.confirmDelivery') + '\n\n' + t('agents.deliveredQty') + ': ' + formatNumber(req.deliveredQty || 0) + ' GEN\n' + t('agents.targetQty') + ': ' + formatNumber(req.genQty) + ' GEN')) return;

    req.status = 'confirmed';
    req.approvals.push({ role: state.currentUser.role, action: 'confirmed', date: new Date().toISOString(), user: state.currentUser.name });
    await postOrderPatch(req.id, { status: 'confirmed' });
    saveToLocalStorage();
    renderPage();
}

async function verifyAgentFulfillment(reqId) {
    const req = state.agentRequests.find(function(r) { return r.id === reqId; });
    if (!req) return;
    const prog = { target: req.genQty, delivered: req.deliveredQty || 0, remaining: Math.max(0, req.genQty - (req.deliveredQty || 0)) };

    if (prog.remaining > 0) {
        if (!confirm(t('agents.orderUnfulfilled') + ': ' + formatNumber(prog.remaining) + ' GEN remaining. ' + t('agents.verifyFulfillment') + ' ' + t('alerts.confirmWarn'))) return;
        req.status = 'verified';
        req.approvals.push({ role: state.currentUser.role, action: 'verified', date: new Date().toISOString(), user: state.currentUser.name, note: 'partial' });
        await postOrderPatch(req.id, { status: 'verified' });
        saveToLocalStorage();
        renderPage();
        return;
    }

    if (!confirm(t('agents.verifyFulfillment') + '\n\n' + t('agents.targetQty') + ': ' + formatNumber(prog.target) + ' GEN\n' + t('agents.deliveredQty') + ': ' + formatNumber(prog.delivered) + ' GEN\n' + t('agents.remainingToDeliver') + ': ' + formatNumber(prog.remaining) + ' GEN')) return;

    req.status = 'verified';
    req.approvals.push({ role: state.currentUser.role, action: 'verified', date: new Date().toISOString(), user: state.currentUser.name });
    await postOrderPatch(req.id, { status: 'verified' });
    saveToLocalStorage();
    renderPage();
}

async function completeAgentOrder(reqId) {
    const req = state.agentRequests.find(function(r) { return r.id === reqId; });
    if (!req) return;
    if (req.status !== 'verified') return;

    const agent = state.agents.find(function(a) { return a.id === req.agentId; });
    if (agent) {
        agent.genQty += req.deliveredQty || 0;
        agent.litersQty = agent.genQty * state.prices.litersPerGen;
    }

    req.status = 'completed';
    req.approvals.push({ role: state.currentUser.role, action: 'completed', date: new Date().toISOString(), user: state.currentUser.name });
    await postOrderPatch(req.id, { status: 'completed' });
    saveToLocalStorage();
    alert(t('agents.fulfillmentVerified'));
    renderPage();
}

// ========================
// CLIENTS PAGE
// ========================
function renderClients() {
    return `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem;"><h2 style="font-size: 1.3rem; color: var(--white);">${t('clients.myClients')}</h2><button class="btn btn-primary btn-sm" data-action="showAddClientModal">+ ${t('clients.addClient')}</button></div>
        <div class="table-container"><div class="table-scrollable"><table>
            <thead><tr><th>${t('clients.clientName')}</th><th>${t('clients.purchasedGen')}</th><th>${t('clients.ratePerGen')}</th><th>${t('agents.balance')}</th><th>${t('table.status')}</th><th>${t('table.actions')}</th></tr></thead>
            <tbody>${state.clients.map(function(client) {
                return '<tr><td>' + escapeHtml(client.name) + '</td><td>' + formatNumber(client.genQty) + ' GEN</td><td>' + formatCurrency(getClientPriceFor(client.name)) + '</td><td class="text-green">' + formatCurrency(client.balance) + '</td><td><span class="status-badge status-' + client.status + '">' + client.status + '</span></td><td><button class="btn btn-secondary btn-xs" data-action="viewClientOrders" data-args="' + client.id + '">' + t('clients.viewOrders') + '</button></td></tr>';
            }).join('')}</tbody>
        </table></div></div>

        ${state.currentUser.role === 'admin' ? renderClientOrderRequestsTable() : ''}
    </div>`;
}

// Client Order Requests table for admin
function renderClientOrderRequestsTable() {
    state.clientRequests = state.clientRequests || [];
    if (state.clientRequests.length === 0) return '';
    return '<div class="card" style="margin-bottom: 2rem;"><h3 style="margin-bottom: 1rem; color: var(--white); font-size: 1.1rem;">' + t('clients.orderRequests') + '</h3><div class="table-scrollable"><table><thead><tr><th>' + t('clients.clientName') + '</th><th>' + t('table.quantity') + '</th><th>' + t('clients.totalToPay') + '</th><th>' + t('table.status') + '</th><th>' + t('table.actions') + '</th></tr></thead><tbody>' + (state.clientRequests || []).map(function(req) {
        const statusClass = 'status-' + req.status;
        const statusLabel = req.status === 'pending' ? t('agents.orderPending') : req.status === 'approved' ? t('agents.orderApproved') : req.status === 'completed' ? t('agents.orderComplete') : req.status;
        let actions = '';
        if (state.currentUser.role === 'admin') {
            if (req.status === 'pending') {
                actions = '<button class="btn btn-success btn-xs" data-action="approveClientOrder" data-args="' + req.id + '">' + t('agents.approve') + '</button>';
            } else if (req.status === 'approved') {
                actions = '<button class="btn btn-primary btn-xs" data-action="fulfillClientOrder" data-args="' + req.id + '">' + t('agents.orderComplete') + '</button>';
            }
        }
        actions += '<button class="btn btn-danger btn-xs" data-action="deleteClientOrder" data-args="' + req.id + '">' + t('alerts.deleteItem') + '</button>';
        return '<tr><td>' + escapeHtml(req.clientName) + '</td><td>' + formatNumber(req.genQty) + ' GEN</td><td>' + formatCurrency(req.amount) + '</td><td><span class="status-badge ' + statusClass + '">' + statusLabel + '</span></td><td>' + actions + '</td></tr>';
    }).join('') + '</tbody></table></div></div>';
}

// Approve a client order - admin action
async function approveClientOrder(reqId) {
    const req = state.clientRequests.find(function(r) { return r.id === reqId; });
    if (!req) return;
    if (!confirm(t('clients.approveOrder') + '\n\n' + t('clients.clientName') + ': ' + req.clientName + '\n' + t('table.quantity') + ': ' + formatNumber(req.genQty) + ' GEN\n' + t('clients.totalToPay') + ': ' + formatCurrency(req.amount))) return;
    req.status = 'approved';
    req.approvals = req.approvals || [];
    req.approvals.push({ role: state.currentUser.role, action: 'approved', date: new Date().toISOString(), user: state.currentUser.name });
    await postOrderPatch(req.id, { status: 'approved' });
    // Update inventory
    state.inventory.availGen = Math.max(0, state.inventory.availGen - req.genQty);
    // Add transaction
    const serverTx = await postRealtime('/api/transactions', { type: 'sale', counterparty: req.clientName, qty: req.genQty, unit: 'gen', rate: getClientPriceFor(req.clientName), amount: req.amount, status: 'completed', date: new Date().toISOString().split('T')[0] });
    const txId = (serverTx && serverTx.transaction && serverTx.transaction.id) || Date.now();
    state.transactions.push({
        id: txId,
        type: 'sale',
        counterparty: req.clientName,
        qty: req.genQty,
        rate: getClientPriceFor(req.clientName),
        amount: req.amount,
        status: 'completed',
        date: new Date().toISOString().split('T')[0]
    });
    saveToLocalStorage();
    renderPage();
}

// Mark client order as fulfilled (after GEN delivery confirmed)
async function fulfillClientOrder(reqId) {
    const req = state.clientRequests.find(function(r) { return r.id === reqId; });
    if (!req) return;
    if (!confirm(t('agents.verifyFulfillment') + ' ' + t('alerts.confirmWarn'))) return;
    req.status = 'completed';
    req.approvals = req.approvals || [];
    req.approvals.push({ role: state.currentUser.role, action: 'completed', date: new Date().toISOString(), user: state.currentUser.name });
    await postOrderPatch(req.id, { status: 'completed' });
    // Update client
    const client = state.clients.find(function(c) { return c.name === req.clientName; });
    if (client) {
        client.genQty += req.genQty;
        client.balance = Math.max(0, client.balance - req.amount);
    }
    saveToLocalStorage();
    renderPage();
}

function showAddClientModal() {
    const fields = [
        { label: 'Nama / Nama Perusahaan', id: 'client-name', type: 'text', placeholder: 'Masukkan nama' },
        { label: 'Nomor Telepon', id: 'client-phone', type: 'tel', placeholder: 'Masukkan telepon' },
        { label: 'Email', id: 'client-email', type: 'email', placeholder: 'Masukkan email' },
        { label: 'Alamat', id: 'client-address', type: 'textarea', placeholder: 'Masukkan alamat' },
        { label: 'Batas Kredit (opsional)', id: 'client-credit', type: 'number', placeholder: 'Masukkan batas' }
    ];
    const footerHtml = '<button class="btn btn-secondary" data-action="closeAddModal">' + t('alerts.filterClear') + '</button><button class="btn btn-primary" data-action="submitAddClient">' + t('clients.addClient') + '</button>';
    showAddModal(t('alerts.addClient'), fields, footerHtml);
}

function submitAddClient() {
    const name = document.getElementById('client-name').value;
    if (!name) { alert(t('alerts.invalidQty')); return; }
    state.clients.push({ id: Date.now(), name: name, genQty: 0, status: 'active', balance: 0 });
    saveToLocalStorage();
    closeAddModal();
    renderPage();
}

function viewClientOrders(id) {
    const client = state.clients.find(function(c) { return c.id === id; });
    if (!client) { alert(t('alerts.noData')); return; }
    const clientTrans = state.transactions.filter(function(tr) { return tr.counterparty === client.name; });
    let tableHtml = '<div class="table-scrollable" style="margin-bottom: 1rem;"><table style="margin-bottom: 0;"><thead><tr><th>' + t('table.date') + '</th><th>' + t('table.type') + '</th><th>' + t('table.quantity') + '</th><th>' + t('table.amount') + '</th><th>' + t('table.status') + '</th></tr></thead><tbody>';
    if (clientTrans.length === 0) { tableHtml += '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);padding:1rem;">' + t('alerts.noData') + '</td></tr>'; }
    else { clientTrans.forEach(function(tr) { tableHtml += '<tr><td>' + tr.date + '</td><td>' + (tr.type === 'sale' ? t('reports.sale') : t('reports.purchase')) + '</td><td>' + formatNumber(tr.qty) + ' GEN</td><td>' + formatCurrency(tr.amount) + '</td><td><span class="status-badge status-' + tr.status + '">' + tr.status + '</span></td></tr>'; }); }
    tableHtml += '</tbody></table></div>';
    const detailHtml = '<div style="display: flex; flex-direction: column; gap: 0.75rem;">' +
        '<p><strong>' + t('clients.clientName') + ':</strong> ' + escapeHtml(client.name) + '</p>' +
        '<p><strong>' + t('agents.balance') + ':</strong> ' + formatCurrency(client.balance) + '</p>' +
        '<p><strong>' + t('clients.purchasedGen') + ':</strong> ' + formatNumber(client.genQty) + ' GEN</p><hr style="border-color: var(--border-color);">' +
        '<p>' + t('clients.viewOrders') + '</p>' + tableHtml + '</div>';
    document.getElementById('modal-title').textContent = escapeHtml(client.name);
    document.getElementById('modal-body').innerHTML = detailHtml;
    document.getElementById('modal-footer').innerHTML = '<button class="btn btn-secondary" data-action="closeAddModal">' + t('alerts.filterClear') + '</button>';
    document.getElementById('add-modal-overlay').classList.add('active');
    document.body.classList.add('body-scroll-lock');
}

// ========================
// INVENTORY PAGE
// ========================
function renderInventory() {
    const totalGen = state.inventory.totalGen;
    const availGen = state.inventory.availGen;
    const dieselFromAgents = state.inventory.dieselFromAgents;
    const dieselFromSuppliers = state.inventory.dieselFromSuppliers;
    const litersPerGen = state.prices.litersPerGen;
    const utilRate = totalGen > 0 ? ((state.inventory.usedGen / totalGen) * 100).toFixed(1) : '0.0';

    return `<div class="widgets-grid" style="margin-bottom: 2rem;">
        <div class="widget"><div class="widget-header"><span class="widget-title">${t('inventory.total')}</span>⛽</div><div class="widget-value">${formatNumber(totalGen)} GEN</div></div>
        <div class="widget"><div class="widget-header"><span class="widget-title">${t('inventory.agentDiesel')}</span>🚛</div><div class="widget-value text-green">${formatNumber(dieselFromAgents)} GEN</div></div>
        <div class="widget"><div class="widget-header"><span class="widget-title">${t('inventory.supplierDiesel')}</span>🏭</div><div class="widget-value text-blue">${formatNumber(dieselFromSuppliers)} GEN</div></div>
        <div class="widget"><div class="widget-header"><span class="widget-title">${t('dashboard.availDiesel')}</span>📦</div><div class="widget-value text-yellow">${formatNumber(availGen)} GEN</div></div>
    </div>
    <div class="table-container" style="margin-bottom: 2rem;"><div class="table-header"><div class="table-title">${t('inventory.breakdown')}</div></div><div class="table-scrollable"><table>
        <thead><tr><th>${t('inventory.source')}</th><th>${t('inventory.qtyGen')}</th><th>${t('inventory.liters')}</th><th>${t('inventory.ratePerGen')}</th><th>${t('inventory.totalCost')}</th><th>${t('table.status')}</th></tr></thead>
        <tbody>
            <tr><td>${t('inventory.agentDiesel')}</td><td>${formatNumber(dieselFromAgents)} GEN</td><td>${formatNumber(dieselFromAgents * litersPerGen)} L</td><td>${formatCurrency(state.prices.agentPricePerGen)}</td><td>${formatCurrency(dieselFromAgents * state.prices.agentPricePerGen)}</td><td><span class="status-badge status-completed">${t('inventory.available')}</span></td></tr>
            <tr><td>${t('inventory.supplierDiesel')}</td><td>${formatNumber(dieselFromSuppliers)} GEN</td><td>${formatNumber(dieselFromSuppliers * litersPerGen)} L</td><td>${formatCurrency(state.prices.supplierPricePerGen)}</td><td>${formatCurrency(dieselFromSuppliers * state.prices.supplierPricePerGen)}</td><td><span class="status-badge status-completed">${t('inventory.available')}</span></td></tr>
            <tr style="border-top: 2px solid var(--border-color);"><td style="font-weight: 600;">${t('inventory.total')}</td><td style="font-weight: 600;">${formatNumber(totalGen)} GEN</td><td style="font-weight: 600;">${formatNumber(totalGen * litersPerGen)} L</td><td colspan="2" style="font-weight: 600;">${t('inventory.utilization')}</td><td style="font-weight: 600;">${utilRate}%</td></tr>
        </tbody>
    </table></div></div>
    <div class="card"><h3 style="margin-bottom: 1rem; color: var(--white); font-size: 1.1rem;">${t('inventory.dieselUtil')}</h3><p style="color: var(--text-secondary); margin-bottom: 1rem;">${t('inventory.acquired')} <strong style="color: var(--white);">${formatNumber(totalGen)} GEN</strong> ${t('inventory.ofDiesel')} ${t('inventory.and')} <strong style="color: var(--white);">${formatNumber(state.inventory.usedGen)} GEN</strong> ${t('inventory.soldToClients')}</p><p style="color: var(--text-secondary);"><strong style="color: var(--text-yellow);">${formatNumber(availGen)} GEN</strong> ${t('inventory.currentlyAvail')} ${t('inventory.forNewOrders')}</p></div>`;
}

// ========================
// REPORT HELPERS
// ========================
function getDateRange(filter) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (filter === 'today') {
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        return { start: today, end: end };
    }
    if (filter === 'week') {
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        return { start: start, end: today };
    } else if (filter === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: start, end: today };
    } else if (filter === 'last_month') {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return { start: start, end: end };
    }
    // all time / default
    return { start: null, end: today };
}

function filterTransactionsByDate(transactions, filter) {
    if (filter === 'all' || !filter) return transactions;
    const range = getDateRange(filter);
    if (!range.start) return transactions;
    return transactions.filter(function(tr) {
        const trDate = new Date(tr.date);
        return trDate >= range.start && trDate <= range.end;
    });
}

function getGenInByCounterparty(transactions) {
    const result = {};
    transactions.filter(function(tr) { return tr.type === 'purchase'; }).forEach(function(tr) {
        result[tr.counterparty] = (result[tr.counterparty] || 0) + tr.qty;
    });
    return result;
}

function getGenOutByCounterparty(transactions) {
    const result = {};
    transactions.filter(function(tr) { return tr.type === 'sale'; }).forEach(function(tr) {
        result[tr.counterparty] = (result[tr.counterparty] || 0) + tr.qty;
    });
    return result;
}

function getAgentPerformance(transactions, agents) {
    const agentTrans = transactions.filter(function(tr) { return tr.type === 'purchase'; });
    return agents.map(function(agent) {
        const trans = agentTrans.filter(function(tr) { return tr.counterparty === agent.name; });
        const totalGen = trans.reduce(function(sum, tr) { return sum + tr.qty; }, 0);
        const totalAmount = trans.reduce(function(sum, tr) { return sum + tr.amount; }, 0);
        const dieselCost = state.prices.dieselPricePerLiter * state.prices.litersPerGen;
        const totalCost = totalGen * dieselCost;
        const profit = totalGen * getAgentProfitPerGen();
        return {
            name: agent.name,
            genProvided: totalGen,
            liters: totalGen * state.prices.litersPerGen,
            totalRevenue: totalAmount,
            totalCost: totalCost,
            netProfit: profit,
            fulfilled: agent.genQty > 0 ? Math.round((totalGen / agent.genQty) * 100) : 0
        };
    });
}

function getSupplierPerformance(transactions) {
    const purchaseTrans = transactions.filter(function(tr) { return tr.type === 'purchase'; });
    const supplierMap = {};
    purchaseTrans.forEach(function(tr) {
        if (!supplierMap[tr.counterparty]) {
            supplierMap[tr.counterparty] = { gen: 0, liters: 0, amount: 0, count: 0 };
        }
        supplierMap[tr.counterparty].gen += tr.qty;
        supplierMap[tr.counterparty].liters += tr.qty * state.prices.litersPerGen;
        supplierMap[tr.counterparty].amount += tr.amount;
        supplierMap[tr.counterparty].count += 1;
    });
    return Object.keys(supplierMap).map(function(name) {
        const s = supplierMap[name];
        s.name = name;
        s.avgRate = s.count > 0 ? s.amount / s.count : 0;
        return s;
    });
}

function getClientOrderFulfillment(transactions, clients) {
    return clients.map(function(client) {
        const clientTrans = transactions.filter(function(tr) {
            return tr.counterparty === client.name && tr.type === 'sale';
        });
        const deliveredGen = clientTrans.reduce(function(sum, tr) { return sum + tr.qty; }, 0);
        const requestedGen = client.genQty || 0;
        const pricePerGen = getClientPriceFor(client.name);
        const totalPaid = clientTrans.reduce(function(sum, tr) { return sum + tr.amount; }, 0);
        return {
            name: client.name,
            requestedGen: requestedGen,
            deliveredGen: deliveredGen,
            pendingGen: Math.max(0, requestedGen - deliveredGen),
            fulfillmentRate: requestedGen > 0 ? Math.round((deliveredGen / requestedGen) * 100) : 0,
            totalToPay: requestedGen * pricePerGen,
            totalPaid: totalPaid
        };
    });
}

function getFinancialSummary(transactions) {
    const sales = transactions.filter(function(tr) { return tr.type === 'sale'; });
    const purchases = transactions.filter(function(tr) { return tr.type === 'purchase'; });
    const totalSales = sales.reduce(function(sum, tr) { return sum + tr.amount; }, 0);
    const totalPurchases = purchases.reduce(function(sum, tr) { return sum + tr.amount; }, 0);
    const dieselCostPerGen = getDieselCostForGen();
    const dieselCostTotal = purchases.reduce(function(sum, tr) {
        return sum + (tr.qty * dieselCostPerGen);
    }, 0);
    const adminProfitPerGen = state.prices.clientPricePerGen - state.prices.agentPricePerGen;
    const grossProfit = totalSales - totalPurchases;
    const netProfit = totalSales - dieselCostTotal;
    return {
        totalSales: totalSales,
        totalPurchases: totalPurchases,
        totalGenSold: sales.reduce(function(sum, tr) { return sum + tr.qty; }, 0),
        totalGenPurchased: purchases.reduce(function(sum, tr) { return sum + tr.qty; }, 0),
        dieselCostTotal: dieselCostTotal,
        grossProfit: grossProfit,
        netProfit: netProfit,
        profitMargin: totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : '0.0',
        totalTransactions: transactions.length,
        adminProfitPerGen: adminProfitPerGen
    };
}

function renderChart(canvasId, labels, data, colors, title) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    const padding = 50;
    const chartWidth = rect.width - padding * 2;
    const chartHeight = rect.height - padding * 2;
    const maxValue = Math.max.apply(null, data) * 1.2;

    // Clear chart background to white for white theme
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (data.length === 0 || maxValue === 0) {
        ctx.fillStyle = '#808080';
        ctx.font = '12px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText(t('reports.noReportData'), rect.width / 2, rect.height / 2);
        return;
    }

    // Draw title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(title || t('reports.chartTitle'), rect.width / 2, 20);

    // Draw axes (lighter for white theme)
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, rect.height - padding);
    ctx.lineTo(rect.width - padding, rect.height - padding);
    ctx.stroke();

    // Draw bars
    const barWidth = chartWidth / data.length * 0.7;
    const barGap = chartWidth / data.length * 0.3;

    data.forEach(function(value, i) {
        const barHeight = (value / maxValue) * chartHeight;
        const x = padding + i * (barWidth + barGap) + barGap / 2;
        const y = rect.height - padding - barHeight;

        ctx.fillStyle = colors[i] || '#4ade80';
        ctx.fillRect(x, y, barWidth, barHeight);

        // Value label
        ctx.fillStyle = '#404040';
        ctx.font = '10px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText(formatCurrency(value), x + barWidth / 2, y - 5);

        // Label
        ctx.fillStyle = '#808080';
        ctx.font = '10px Segoe UI';
        ctx.save();
        ctx.translate(x + barWidth / 2, rect.height - padding + 15);
        ctx.rotate(-0.4);
        ctx.textAlign = 'right';
        ctx.fillText(labels[i] || '', 0, 0);
        ctx.restore();
    });

    // Y-axis labels
    ctx.fillStyle = '#a0a0a0';
    ctx.font = '10px Segoe UI';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
        const val = (maxValue / 4) * i;
        const y = rect.height - padding - (chartHeight / 4) * i;
        ctx.fillText(formatCurrency(val), padding - 5, y);
    }
}

function exportToExcel() {
    try {
        const reportDate = new Date().toISOString().split('T')[0];
        const lang = state.preferences.language;

        // Get all report data
        const filteredTrans = filterTransactionsByDate(state.transactions, state.reportFilter || 'all');
        const financial = getFinancialSummary(filteredTrans);
        const agentPerf = getAgentPerformance(filteredTrans, state.agents);
        const supplierPerf = getSupplierPerformance(filteredTrans);
        const clientFulfillment = getClientOrderFulfillment(filteredTrans, state.clients);

        // Build CSV-like content with Excel-compatible formatting
        let csv = '';
        csv += '\xEF\xBB\xBF'; // UTF-8 BOM for Excel

        // Header with styling info
        csv += 'GenApp Financial Report\r\n';
        csv += 'Report Date: ' + reportDate + '\r\n';
        csv += 'Date Range: ' + (state.reportFilter === 'all' ? t('reports.allData') : (state.reportFilter === 'week' ? t('alerts.week') : state.reportFilter === 'month' ? t('alerts.month') : state.reportFilter === 'last_month' ? t('alerts.lastMonth') : state.reportFilter === 'today' ? t('alerts.today') : t('alerts.lastMonth'))) + '\r\n';
        csv += '\r\n';

        // Financial Summary
        csv += t('reports.financialSummary') + '\r\n';
        csv += t('reports.totalSalesRev') + ',' + formatCurrency(financial.totalSales) + '\r\n';
        csv += t('reports.totalPurchaseCost') + ',' + formatCurrency(financial.totalPurchases) + '\r\n';
        csv += t('reports.dieselCost') + ',' + formatCurrency(financial.dieselCostTotal) + '\r\n';
        csv += t('reports.netProfit') + ',' + formatCurrency(financial.netProfit) + '\r\n';
        csv += t('reports.profitMargin') + ',' + financial.profitMargin + '%\r\n';
        csv += t('dashboard.profitPerGenLabel') + ',' + formatCurrency(financial.adminProfitPerGen) + '\r\n';
        csv += '\r\n';

        // Transaction Details
        csv += t('titles.transactions') + '\r\n';
        csv += t('table.date') + ',' + t('table.type') + ',' + t('table.counterparty') + ',' + t('table.quantity') + ',' + t('table.unit') + ',' + t('table.ratePerGen') + ',' + t('table.amount') + ',' + t('table.status') + '\r\n';
        filteredTrans.forEach(function(tr) {
            csv += tr.date + ',' +
                   (tr.type === 'sale' ? t('reports.sale') : t('reports.purchase')) + ',' +
                   tr.counterparty + ',' +
                   tr.qty + ',' +
                   tr.unit + ',' +
                   formatCurrency(tr.rate) + ',' +
                   formatCurrency(tr.amount) + ',' +
                   tr.status + '\r\n';
        });
        csv += '\r\n';

        // Agent Performance
        csv += t('reports.agentPerformance') + '\r\n';
        csv += t('reports.agentName') + ',' + t('reports.genProvided') + ',' + t('reports.totalLiters') + ',' + t('reports.totalRevenue') + ',' + t('reports.totalCost') + ',' + t('reports.netProfit') + '\r\n';
        agentPerf.forEach(function(a) {
            csv += a.name + ',' + formatNumber(a.genProvided) + ',' + formatNumber(a.liters) + ',' + formatCurrency(a.totalRevenue) + ',' + formatCurrency(a.totalCost) + ',' + formatCurrency(a.netProfit) + '\r\n';
        });
        csv += '\r\n';

        // Supplier Performance
        csv += t('reports.supplierPerformance') + '\r\n';
        csv += t('reports.supplierName') + ',' + t('reports.genProvided') + ',' + t('reports.totalLiters') + ',' + t('reports.totalRevenue') + ',' + t('reports.avgDieselCost') + '\r\n';
        supplierPerf.forEach(function(s) {
            csv += s.name + ',' + formatNumber(s.gen) + ',' + formatNumber(s.liters) + ',' + formatCurrency(s.amount) + ',' + formatCurrency(s.avgRate) + '\r\n';
        });
        csv += '\r\n';

        // Client Order Fulfillment
        csv += t('reports.clientOrderFulfillment') + '\r\n';
        csv += t('users.user') + ',' + t('reports.requestedGen') + ',' + t('reports.deliveredGen') + ',' + t('reports.pendingDelivery') + ',' + t('reports.fulfillmentRate') + ',' + t('clients.totalToPay') + ',' + t('reports.totalPaid') + ',' + t('reports.orderStatus') + '\r\n';
        clientFulfillment.forEach(function(c) {
            const status = c.pendingGen > 0 ? t('reports.pending') : t('reports.fulfilled');
            csv += c.name + ',' + formatNumber(c.requestedGen) + ',' + formatNumber(c.deliveredGen) + ',' + formatNumber(c.pendingGen) + ',' + c.fulfillmentRate + '%,' + formatCurrency(c.totalToPay) + ',' + formatCurrency(c.totalPaid) + ',' + status + '\r\n';
        });

        // Create blob and trigger download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'GenApp_Report_' + reportDate + '.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert(t('reports.exportSuccess'));
    } catch(e) {
        console.error('Excel export error:', e);
        alert(t('reports.exportError'));
    }
}

function renderChartPlaceholder(canvasId, title) {
    const container = document.getElementById(canvasId + '-container');
    if (container) {
        container.innerHTML = '<canvas id="' + canvasId + '" class="report-chart"></canvas>';
    }
}

// ========================
// REPORTS PAGE
// ========================
function renderReports() {
    let reportFilter = state.reportFilter || 'all';
    const filteredTrans = filterTransactionsByDate(state.transactions, reportFilter);
    const financial = getFinancialSummary(filteredTrans);
    const dieselCostPerGen = getDieselCostForGen();
    const adminProfitPerGen = financial.adminProfitPerGen;
    const agentPerf = getAgentPerformance(filteredTrans, state.agents);
    const supplierPerf = getSupplierPerformance(filteredTrans);
    const clientFulfillment = getClientOrderFulfillment(filteredTrans, state.clients);

    // Build chart data (sales/revenue by date)
    const chartLabels = {};
    filteredTrans.forEach(function(tr) {
        if (!chartLabels[tr.date]) chartLabels[tr.date] = { sales: 0, purchases: 0 };
        if (tr.type === 'sale') chartLabels[tr.date].sales += tr.amount;
        else chartLabels[tr.date].purchases += tr.qty * dieselCostPerGen;
    });
    const sortedDates = Object.keys(chartLabels).sort();
    const salesData = sortedDates.map(function(d) { return chartLabels[d].sales; });
    const costData = sortedDates.map(function(d) { return chartLabels[d].purchases; });
    const chartColors = salesData.map(function(v, i) { return i % 2 === 0 ? '#4ade80' : '#fbbf24'; });

    return `<div class="filter-bar" style="margin-bottom: 1.5rem;">
        <div class="form-group" style="min-width: 140px;"><label class="form-label">${t('reports.dateRange')}</label><select class="input-field" id="report-date-filter" data-change="filterReports">
            <option value="all" ${reportFilter === 'all' ? 'selected' : ''}>${t('reports.allData')}</option>
            <option value="week" ${reportFilter === 'week' ? 'selected' : ''}>${t('alerts.week')}</option>
            <option value="month" ${reportFilter === 'month' ? 'selected' : ''}>${t('alerts.month')}</option>
            <option value="last_month" ${reportFilter === 'last_month' ? 'selected' : ''}>${t('alerts.lastMonth')}</option>
            <option value="today" ${reportFilter === 'today' ? 'selected' : ''}>${t('alerts.today')}</option>
        </select></div>
        <button class="btn btn-secondary btn-sm" data-action="exportToExcel">${t('reports.exportExcel')}</button>
    </div>
    <div class="widgets-grid" style="margin-bottom: 2rem;">
        <div class="widget"><div class="widget-header"><span class="widget-title">${t('reports.profitMargin')}</span></div><div class="widget-value text-green">${financial.profitMargin}%</div><div class="widget-change">${t('reports.basedOn')} ${filteredTrans.length} ${t('reports.transactions')}</div></div>
        <div class="widget"><div class="widget-header"><span class="widget-title">${t('reports.totalSalesRev')}</span></div><div class="widget-value">${formatCurrency(financial.totalSales)}</div></div>
        <div class="widget"><div class="widget-header"><span class="widget-title">${t('reports.totalPurchaseCost')}</span></div><div class="widget-value">${formatCurrency(financial.totalPurchases)}</div></div>
        <div class="widget"><div class="widget-header"><span class="widget-title">${t('reports.netProfit')}</span></div><div class="widget-value text-green">${formatCurrency(financial.netProfit)}</div></div>
    </div>

    <div class="card" style="margin-bottom: 2rem;">
        <h3 style="margin-bottom: 1rem; color: var(--white); font-size: 1.1rem;">📊 ${t('reports.chartTitle')}</h3>
        <div id="profit-chart-container" style="height: 200px; width: 100%; position: relative;">
            <canvas id="profit-chart" class="report-chart"></canvas>
        </div>
        <p style="color: var(--text-tertiary); font-size: 0.8rem; margin-top: 0.5rem;">${t('reports.chartSubtitle')}</p>
    </div>

    <div class="table-container" style="margin-bottom: 2rem;"><div class="table-header"><div class="table-title">${t('reports.financialSummary')}</div></div>
        <div class="table-scrollable"><table>
            <thead><tr><th>${t('table.counterparty')}</th><th>${t('table.type')}</th><th>${t('table.date')}</th><th>${t('table.quantity')}</th><th>${t('table.amount')}</th><th>${t('reports.profitLoss')}</th></tr></thead>
            <tbody>${filteredTrans.map(function(tr) {
                const profit = tr.type === 'sale' ? tr.amount - (tr.qty * state.prices.agentPricePerGen) : -(tr.qty * dieselCostPerGen);
                return '<tr><td>' + escapeHtml(tr.counterparty) + '</td><td><span class="text-' + (tr.type === 'sale' ? 'green' : 'yellow') + '">' + (tr.type === 'sale' ? t('reports.sale') : t('reports.purchase')) + '</span></td><td>' + tr.date + '</td><td>' + formatNumber(tr.qty) + '</td><td>' + formatCurrency(tr.amount) + '</td><td class="' + (profit >= 0 ? 'text-green' : 'text-yellow') + '">' + formatCurrency(Math.abs(profit)) + (profit >= 0 ? ' +' : ' -') + '</td></tr>';
            }).join('')}</tbody>
        </table></div>
    </div>

    <div class="table-container" style="margin-bottom: 2rem;"><div class="table-header"><div class="table-title">${t('reports.genInOut')}</div></div>
        <div class="table-scrollable"><table>
            <thead><tr><th>${t('table.counterparty')}</th><th>${t('reports.genIn')}</th><th>${t('reports.genOut')}</th><th>${t('reports.genBalance')}</th><th>${t('reports.totalLiters')}</th></tr></thead>
            <tbody>${renderGenInOutTable(filteredTrans).join('')}</tbody>
        </table></div>
    </div>

    <div class="table-container" style="margin-bottom: 2rem;"><div class="table-header"><div class="table-title">${t('reports.agentPerformance')}</div></div>
        <div class="table-scrollable"><table>
            <thead><tr><th>${t('reports.agentName')}</th><th>${t('reports.genProvided')}</th><th>${t('reports.totalLiters')}</th><th>${t('reports.totalRevenue')}</th><th>${t('reports.totalCost')}</th><th>${t('reports.netProfit')}</th><th>${t('dashboard.quotaToFulfill')}</th></tr></thead>
            <tbody>${agentPerf.map(function(a) {
                return '<tr><td>' + escapeHtml(a.name) + '</td><td>' + formatNumber(a.genProvided) + '</td><td>' + formatNumber(a.liters) + '</td><td>' + formatCurrency(a.totalRevenue) + '</td><td>' + formatCurrency(a.totalCost) + '</td><td class="text-green">' + formatCurrency(a.netProfit) + '</td><td>' + a.fulfilled + '%</td></tr>';
            }).join('')}</tbody>
        </table></div>
    </div>

    <div class="table-container" style="margin-bottom: 2rem;"><div class="table-header"><div class="table-title">${t('reports.supplierPerformance')}</div></div>
        <div class="table-scrollable"><table>
            <thead><tr><th>${t('reports.supplierName')}</th><th>${t('reports.genProvided')}</th><th>${t('reports.totalLiters')}</th><th>${t('reports.totalRevenue')}</th><th>${t('reports.avgDieselCost')}</th></tr></thead>
            <tbody>${supplierPerf.map(function(s) {
                return '<tr><td>' + escapeHtml(s.name) + '</td><td>' + formatNumber(s.gen) + '</td><td>' + formatNumber(s.liters) + '</td><td>' + formatCurrency(s.amount) + '</td><td>' + formatCurrency(s.avgRate) + '</td></tr>';
            }).join('')}</tbody>
        </table></div>
    </div>

    <div class="table-container" style="margin-bottom: 2rem;"><div class="table-header"><div class="table-title">${t('reports.clientOrderFulfillment')}</div></div>
        <div class="table-scrollable"><table>
            <thead><tr><th>${t('users.user')}</th><th>${t('reports.requestedGen')}</th><th>${t('reports.deliveredGen')}</th><th>${t('reports.pendingDelivery')}</th><th>${t('reports.fulfillmentRate')}</th><th>${t('clients.totalToPay')}</th><th>${t('reports.totalPaid')}</th><th>${t('reports.orderStatus')}</th></tr></thead>
            <tbody>${clientFulfillment.map(function(c) {
                const status = c.pendingGen > 0 ? '<span class="status-badge status-pending">' + t('reports.pending') + '</span>' : '<span class="status-badge status-completed">' + t('reports.fulfilled') + '</span>';
                return '<tr><td>' + escapeHtml(c.name) + '</td><td>' + formatNumber(c.requestedGen) + '</td><td>' + formatNumber(c.deliveredGen) + '</td><td>' + formatNumber(c.pendingGen) + '</td><td>' + c.fulfillmentRate + '%</td><td>' + formatCurrency(c.totalToPay) + '</td><td>' + formatCurrency(c.totalPaid) + '</td><td>' + status + '</td></tr>';
            }).join('')}</tbody>
        </table></div>
    </div>

    <div class="card" style="margin-bottom: 2rem;">
        <h3 style="margin-bottom: 1rem; color: var(--white); font-size: 1.1rem;">${t('settings.dieselPrice')} / ${t('settings.litersPerGen')}</h3>
        <p style="color: var(--text-secondary);">${t('alerts.dieselCost')}: ${formatCurrency(dieselCostPerGen)} / GEN (${formatCurrency(state.prices.dieselPricePerLiter)} x ${formatNumber(state.prices.litersPerGen)} L)</p>
        <p style="color: var(--text-secondary);">${t('dashboard.myProfit')}: ${formatCurrency(adminProfitPerGen)} / GEN (${formatCurrency(state.prices.clientPricePerGen)} - ${formatCurrency(state.prices.agentPricePerGen)})</p>
    </div>`;
}

function renderGenInOutTable(transactions) {
    const genIn = getGenInByCounterparty(transactions);
    const genOut = getGenOutByCounterparty(transactions);
    const allParties = {};
    Object.keys(genIn).forEach(function(k) { allParties[k] = { in: genIn[k], out: 0 }; });
    Object.keys(genOut).forEach(function(k) {
        if (allParties[k]) allParties[k].out = genOut[k];
        else allParties[k] = { in: 0, out: genOut[k] };
    });
    return Object.keys(allParties).map(function(name) {
        const p = allParties[name];
        const balance = p.in - p.out;
        const liters = balance * state.prices.litersPerGen;
        return '<tr><td>' + escapeHtml(name) + '</td><td>' + formatNumber(p.in) + '</td><td>' + formatNumber(p.out) + '</td><td class="' + (balance >= 0 ? 'text-green' : 'text-yellow') + '">' + formatNumber(balance) + '</td><td>' + formatNumber(liters) + ' L</td></tr>';
    });
}

function filterReports() {
    state.reportFilter = document.getElementById('report-date-filter').value;
    renderReportsToDOM();
}

function renderReportsToDOM() {
    const contentArea = document.getElementById('content-area');
    if (contentArea) {
        contentArea.innerHTML = renderReports();
        // Render chart after DOM update
        setTimeout(function() {
            const filteredTrans = filterTransactionsByDate(state.transactions, state.reportFilter || 'all');
            const chartLabels = {};
            filteredTrans.forEach(function(tr) {
                if (!chartLabels[tr.date]) chartLabels[tr.date] = { sales: 0, purchases: 0 };
                if (tr.type === 'sale') chartLabels[tr.date].sales += tr.amount;
                else chartLabels[tr.date].purchases += tr.qty * getDieselCostForGen();
            });
            const sortedDates = Object.keys(chartLabels).sort();
            const salesData = sortedDates.map(function(d) { return chartLabels[d].sales; });
            const costData = sortedDates.map(function(d) { return chartLabels[d].purchases; });
            renderChart('profit-chart', sortedDates, salesData.concat(costData), null, t('reports.chartTitle'));
        }, 50);
    }
}

// ========================
// USERS PAGE (Admin only)
// ========================
function renderUsers() {
    if (state.currentUser.role !== 'admin') {
        return '<div class="card" style="text-align: center; padding: 3rem;"><h3 style="color: var(--accent-red); margin-bottom: 1rem;">' + t('users.accessDenied') + '</h3><p style="color: var(--text-secondary);">' + t('users.adminOnly') + '</p></div>';
    }
    return `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem;"><h2 style="font-size: 1.3rem; color: var(--white);">${t('users.userManagement')}</h2><button class="btn btn-primary btn-sm" data-action="showAddUserModal">+ ${t('users.addUser')}</button></div>
        <div class="filter-bar"><div class="form-group"><label class="form-label">${t('users.role')}</label><select class="input-field" id="filter-user-role" data-change="filterUsers"><option value="">${t('alerts.filterAll')}</option><option value="admin">${t('users.admins')}</option><option value="client">${t('users.clients')}</option><option value="agent">${t('users.agents')}</option></select></div><button class="btn btn-secondary btn-sm" data-action="clearUserFilters">${t('alerts.filterClear')}</button></div>
        <div class="table-container"><div class="table-scrollable"><table>
            <thead><tr><th>${t('users.user')}</th><th>${t('users.email')}</th><th>${t('users.role')}</th><th>${t('table.status')}</th><th>${t('table.actions')}</th></tr></thead>
            <tbody id="users-tbody">${renderUsersTable(state.users)}</tbody>
        </table></div></div>`;
}

function renderUsersTable(users) {
    if (users.length === 0) { return '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 2rem;">' + t('alerts.noData') + '</td></tr>'; }
    return users.map(function(u) {
        const avatar = u.avatar || u.name.charAt(0);
        const roleColors = { admin: 'role-admin', client: 'role-client', agent: 'role-agent' };
        return '<tr><td><div style="display: flex; align-items: center; gap: 0.75rem;"><div class="user-avatar" style="background: linear-gradient(135deg, var(--accent-blue), #3b82f6);">' + escapeHtml(avatar) + '</div>' + escapeHtml(u.name) + '</div></td><td>' + escapeHtml(u.email) + '</td><td><span class="user-role-badge ' + roleColors[u.role] + '">' + (u.role === 'admin' ? t('users.admins') : u.role === 'client' ? t('users.clients') : t('users.agents')) + '</span></td><td><span class="status-badge status-completed">' + t('users.active') + '</span></td><td><button class="btn btn-secondary btn-xs" data-action="editUser" data-args="' + u.id + '">' + t('users.edit') + '</button><button class="btn btn-danger btn-xs" data-action="deleteUser" data-args="' + u.id + '">' + t('alerts.deleteItem') + '</button></td></tr>';
    }).join('');
}

function showAddUserModal() {
    const fields = [
        { label: t('users.username'), id: 'user-username', type: 'text', placeholder: t('users.usernameHint') },
        { label: t('users.fullName'), id: 'user-name-input', type: 'text', placeholder: t('users.nameHint') },
        { label: t('users.email'), id: 'user-email', type: 'email', placeholder: t('users.emailHint') },
        { label: t('users.role'), id: 'user-role-select', type: 'select', options: [{ value: 'admin', label: t('users.admins') }, { value: 'client', label: t('users.clients') }, { value: 'agent', label: t('users.agents') }] },
        { label: t('users.phone'), id: 'user-phone', type: 'tel', placeholder: t('users.phoneHint') },
        { label: t('users.password'), id: 'user-password', type: 'password', placeholder: t('users.passwordHint') }
    ];
    const footerHtml = '<button class="btn btn-secondary" data-action="closeAddModal">' + t('alerts.filterClear') + '</button><button class="btn btn-primary" data-action="submitAddUser">' + t('users.addUser') + '</button>';
    showAddModal(t('alerts.addUser'), fields, footerHtml);
}

async function submitAddUser() {
    const username = document.getElementById('user-username').value;
    const name = document.getElementById('user-name-input').value;
    const email = document.getElementById('user-email').value;
    const role = document.getElementById('user-role-select').value;
    const password = document.getElementById('user-password').value;
    if (!username || !name || !email || !password) { alert(t('alerts.invalidQty')); return; }
    try {
        const resp = await fetch('/api/users', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, name: name, email: email, role: role, password: password })
        });
        const data = await resp.json();
        if (!data.ok) { alert(data.error || t('alerts.noData')); return; }
        await fetchUsers();
        closeAddModal();
        renderPage();
    } catch (e) { alert(t('alerts.noData')); }
}

function editUser(id) {
    const users = state.users || [];
    const user = users.find(function(u) { return u.id === id; });
    if (!user) { alert(t('alerts.noData')); return; }
    const fields = [
        { label: t('users.username'), id: 'user-username', type: 'text', placeholder: t('users.usernameHint'), value: user.username || '' },
        { label: t('users.fullName'), id: 'user-name-input', type: 'text', placeholder: t('users.nameHint'), value: user.name },
        { label: t('users.email'), id: 'user-email', type: 'email', placeholder: t('users.emailHint'), value: user.email },
        { label: t('users.role'), id: 'user-role-select', type: 'select', options: [{ value: 'admin', label: t('users.admins') }, { value: 'client', label: t('users.clients') }, { value: 'agent', label: t('users.agents') }], value: user.role },
        { label: t('users.phone'), id: 'user-phone', type: 'tel', placeholder: t('users.phoneHint'), value: user.phone || '' },
        { label: t('users.password'), id: 'user-password', type: 'password', placeholder: t('users.passwordHintEdit'), value: '' }
    ];
    const footerHtml = '<button class="btn btn-secondary" data-action="closeAddModal">' + t('alerts.filterClear') + '</button>' +
        '<button class="btn btn-primary" data-action="saveUserEdit" data-args="' + id + '">' + t('users.save') + '</button>';
    showAddModal(t('users.edit'), fields, footerHtml);
}

async function saveUserEdit(id) {
    const username = document.getElementById('user-username').value;
    const name = document.getElementById('user-name-input').value;
    const email = document.getElementById('user-email').value;
    const role = document.getElementById('user-role-select').value;
    const phone = document.getElementById('user-phone').value;
    const password = document.getElementById('user-password').value;
    if (!username || !name || !email) { alert(t('alerts.invalidQty')); return; }
    try {
        const body = { username: username, name: name, email: email, role: role };
        if (password) { body.password = password; }   // empty -> backend keeps current hash
        const resp = await fetch('/api/users/' + id, {
            method: 'PUT',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await resp.json();
        if (!data.ok) { alert(data.error || t('alerts.noData')); return; }
        await fetchUsers();
        closeAddModal();
        renderPage();
    } catch (e) { alert(t('alerts.noData')); }
}
function filterUsers() {
    const roleFilter = document.getElementById('filter-user-role').value;
    let filtered = state.users || [];
    if (roleFilter) { filtered = filtered.filter(function(u) { return u.role === roleFilter; }); }
    document.getElementById('users-tbody').innerHTML = renderUsersTable(filtered);
}

function clearUserFilters() {
    document.getElementById('filter-user-role').value = '';
    document.getElementById('users-tbody').innerHTML = renderUsersTable(state.users || []);
}

// ========================
// SETTINGS PAGE (Admin only)
// ========================
function renderSettings() {
    if (state.currentUser.role !== 'admin') {
        return '<div class="card" style="text-align: center; padding: 3rem;"><h3 style="color: var(--accent-red); margin-bottom: 1rem;">' + t('users.accessDenied') + '</h3><p style="color: var(--text-secondary);">' + t('users.adminOnly') + '</p></div>';
    }

    const profitPerGen = state.prices.clientPricePerGen - state.prices.agentPricePerGen;
    const dieselCostPerGen = getDieselCostForGen();
    const agentProfit = state.prices.agentPricePerGen - dieselCostPerGen;

    return `<div class="table-container"><div class="table-header"><div class="table-title">${t('settings.pricingConfig')}</div></div><div style="padding: 1.5rem;">
        <div class="form-grid">
            <div class="form-group"><label class="form-label">${t('settings.clientPrice')}</label><input type="text" class="input-field" id="client-price" value="${formatNumber(state.prices.clientPricePerGen)}" inputmode="numeric" pattern="[0-9.]*" data-input="formatThousandsInput" data-args="this"><p style="color: var(--text-tertiary); font-size: 0.75rem; margin-top: 0.25rem;">${t('settings.clientPriceDesc')}</p></div>
            <div class="form-group"><label class="form-label">${t('settings.agentPrice')}</label><input type="text" class="input-field" id="agent-price" value="${formatNumber(state.prices.agentPricePerGen)}" inputmode="numeric" pattern="[0-9.]*" data-input="formatThousandsInput" data-args="this"><p style="color: var(--text-tertiary); font-size: 0.75rem; margin-top: 0.25rem;">${t('settings.agentPriceDesc')}</p></div>
            <div class="form-group"><label class="form-label">${t('settings.supplierPrice')}</label><input type="text" class="input-field" id="supplier-price" value="${formatNumber(state.prices.supplierPricePerGen)}" inputmode="numeric" pattern="[0-9.]*" data-input="formatThousandsInput" data-args="this"><p style="color: var(--text-tertiary); font-size: 0.75rem; margin-top: 0.25rem;">${t('settings.supplierPriceDesc')}</p></div>
            <div class="form-group"><label class="form-label">${t('settings.dieselPrice')}</label><input type="text" class="input-field" id="diesel-price" value="${formatNumber(state.prices.dieselPricePerLiter)}" inputmode="numeric" pattern="[0-9.]*" data-input="formatThousandsInput" data-args="this"><p style="color: var(--text-tertiary); font-size: 0.75rem; margin-top: 0.25rem;">${t('settings.dieselPriceDesc')}</p></div>
            <div class="form-group"><label class="form-label">${t('settings.litersPerGen')}</label><input type="text" class="input-field" id="liters-per-gen" value="${formatNumber(state.prices.litersPerGen)}" inputmode="numeric" pattern="[0-9.]*" data-input="formatThousandsInput" data-args="this"><p style="color: var(--text-tertiary); font-size: 0.75rem; margin-top: 0.25rem;">${t('settings.litersPerGenDesc')}</p></div>
            <div class="form-group"><label class="form-label">${t('settings.profitMargin')}</label><div style="background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.6rem 0.85rem; color: var(--accent-green); font-weight: 600;">Rp ${profitPerGen.toLocaleString('id-ID')} / GEN<br><div style="font-size: 0.65rem; color: var(--text-tertiary); margin-top: 0.25rem;">${t('settings.profitDiff')}</div></div></div>
        </div>
        <div class="form-actions"><button class="btn btn-primary" data-action="saveSettings">${t('settings.saveConfig')}</button><button class="btn btn-secondary" data-action="resetSettings">${t('settings.reset')}</button></div>
    </div></div>
    <div class="table-container"><div class="table-header"><div class="table-title">${t('settings.preferences')}</div></div><div style="padding: 1.5rem;"><div class="form-grid">
        <div class="form-group"><label class="form-label">${t('settings.currency')}</label><select class="input-field" id="pref-currency"><option value="IDR" ${state.preferences.currency === 'IDR' ? 'selected' : ''}>IDR - Rupiah</option></select></div>
        <div class="form-group"><label class="form-label">${t('settings.measurementUnit')}</label><select class="input-field" id="pref-measurement"><option value="GEN" ${state.preferences.measurementUnit === 'GEN' ? 'selected' : ''}>GEN (Standar)</option><option value="Liters" ${state.preferences.measurementUnit === 'Liters' ? 'selected' : ''}>${t('settings.litersOnly')}</option></select></div>
        <div class="form-group"><label class="form-label">${t('settings.language')}</label><select class="input-field" id="pref-language"><option value="en" ${state.preferences.language === 'en' ? 'selected' : ''}>English</option><option value="id" ${state.preferences.language === 'id' ? 'selected' : ''}>Bahasa Indonesia</option></select></div>
        <div class="form-group"><label class="form-label">${t('settings.dateFormat')}</label><select class="input-field" id="pref-date-format"><option value="YYYY-MM-DD" ${state.preferences.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD</option><option value="DD/MM/YYYY" ${state.preferences.dateFormat === 'DD/MM/YYYY' ? 'selected' : ''}>DD/MM/YYYY</option><option value="MM/DD/YYYY" ${state.preferences.dateFormat === 'MM/DD/YYYY' ? 'selected' : ''}>MM/DD/YYYY</option></select></div>
    </div><div class="form-actions"><button class="btn btn-primary" data-action="savePreferences">${t('settings.savePrefs')}</button></div></div></div>
    </div>
    <div class="table-container" style="margin-bottom: 2rem;">
        <div class="table-header"><div class="table-title" style="color: var(--accent-red);">${t('settings.deleteDatabase')}</div></div>
        <div style="padding: 1.5rem;">
            <p style="color: var(--text-secondary); margin-bottom: 1rem;">${t('settings.deleteConfirm1')}</p>
            <div class="form-grid">
                <div class="form-group">
                    <label class="form-label">${t('settings.deleteScope')}</label>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem;"><input type="checkbox" id="del-tx" value="transactions"> ${t('settings.deleteTransactions')}</label>
                        <label style="display: flex; align-items: center; gap: 0.5rem;"><input type="checkbox" id="del-agents" value="agents"> ${t('settings.deleteAgents')}</label>
                        <label style="display: flex; align-items: center; gap: 0.5rem;"><input type="checkbox" id="del-clients" value="clients"> ${t('settings.deleteClients')}</label>
                        <label style="display: flex; align-items: center; gap: 0.5rem;"><input type="checkbox" id="del-inventory" value="inventory"> ${t('settings.deleteInventory')}</label>
                <label style="display: flex; align-items: center; gap: 0.5rem;"><input type="checkbox" id="del-users" value="users"> ${t('settings.deleteUsers')}</label>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">${t('settings.deleteDateRange')}</label>
                    <select class="input-field" id="del-date-range">
                        <option value="all">${t('settings.deleteAll')}</option>
                        <option value="today">${t('settings.deleteToday')}</option>
                        <option value="week">${t('settings.deleteWeek')}</option>
                        <option value="month">${t('settings.deleteMonth')}</option>
                        <option value="last_month">${t('settings.deleteLastMonth')}</option>
                        <option value="custom">${t('settings.deleteCustomRange')}</option>
                    </select>
                </div>
                <div class="form-group" id="del-custom-range" style="display: none;">
                    <label class="form-label">${t('settings.deleteFrom')}</label>
                    <input type="date" class="input-field" id="del-date-from">
                    <label class="form-label" style="margin-top: 0.5rem;">${t('settings.deleteTo')}</label>
                    <input type="date" class="input-field" id="del-date-to">
                </div>
            </div>
            <div class="form-actions">
                <button class="btn btn-secondary" data-action="cancelDeleteDatabase">${t('alerts.filterClear')}</button>
                <button class="btn btn-danger" data-action="showDeleteDatabaseConfirm">${t('settings.deleteBtn')}</button>
            </div>
        </div>
    </div>`;
}

// ========================
// Delete Database feature
function showDeleteDatabaseConfirm() {
    var scopes = [];
    if (document.getElementById('del-tx').checked) scopes.push('transactions');
    if (document.getElementById('del-agents').checked) scopes.push('agents');
    if (document.getElementById('del-clients').checked) scopes.push('clients');
    if (document.getElementById('del-inventory').checked) scopes.push('inventory');
    if (document.getElementById('del-users').checked) scopes.push('users');
    if (scopes.length === 0) { alert(t('alerts.invalidQty')); return; }
    window._deleteDbScopes = scopes;

    var range = document.getElementById('del-date-range').value;
    var dateRange = null;
    if (range === 'custom') {
        var from = document.getElementById('del-date-from').value;
        var to = document.getElementById('del-date-to').value;
        if (!from) { alert(t('alerts.invalidQty')); return; }
        dateRange = { start: from, end: to || null };
    } else if (range !== 'all') {
        var dr = getDateRangeForDelete(range);
        if (dr) dateRange = dr;
    }
    window._deleteDbDateRange = dateRange;

    if (!confirm(t('settings.deleteConfirm1'))) { alert(t('settings.deleteCancelled')); return; }

    var confirmText = prompt(t('settings.deleteConfirm2'));
    if (confirmText !== 'DELETE' && confirmText !== 'HAPUS') {
        alert(t('settings.deleteCancelled')); return;
    }

    deleteDatabase();
}

function getDateRangeForDelete(filter) {
    if (filter === 'today') return getDateRange('today');
    if (filter === 'week') return getDateRange('week');
    if (filter === 'month') return getDateRange('month');
    if (filter === 'last_month') return getDateRange('last_month');
    return null;
}

async function deleteDatabase() {
    var scopes = window._deleteDbScopes || [];
    var dateRange = window._deleteDbDateRange || null;
    if (scopes.length === 0) return;

    try {
        var resp = await fetch('/api/admin/delete-data', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ scope: scopes, dateRange: dateRange }),
            signal: AbortSignal.timeout(10000)
        });
        var data = await resp.json();
        if (!data.ok) throw new Error(data.error || 'Unknown error');

        if (scopes.includes('transactions')) { state.transactions = []; }
        if (scopes.includes('agents')) { state.agentRequests = []; }
        if (scopes.includes('clients')) { state.clientRequests = []; state.clients = []; }
        if (scopes.includes('inventory')) {
            state.inventory = { totalGen: 0, availGen: 0, usedGen: 0, dieselFromAgents: 0, dieselFromSuppliers: 0 };
            state.orders = [];
        }

        saveToLocalStorage();
        renderPage();
        setupDeleteDateRangeToggle();
        alert(t('settings.deleteSuccess'));

        document.getElementById('del-tx').checked = false;
        document.getElementById('del-agents').checked = false;
        document.getElementById('del-clients').checked = false;
        document.getElementById('del-inventory').checked = false;
        document.getElementById('del-date-range').value = 'all';
        var custom = document.getElementById('del-custom-range');
        if (custom) custom.style.display = 'none';

        window._deleteDbScopes = [];
        window._deleteDbDateRange = null;
    } catch (e) {
        console.error('Delete database error:', e);
        alert(t('settings.deleteError') + ': ' + e.message);
    }
}

function cancelDeleteDatabase() {
    var el = document.getElementById('del-tx'); if (el) el.checked = false;
    el = document.getElementById('del-agents'); if (el) el.checked = false;
    el = document.getElementById('del-clients'); if (el) el.checked = false;
    el = document.getElementById('del-inventory'); if (el) el.checked = false;
    el = document.getElementById('del-date-range'); if (el) el.value = 'all';
    el = document.getElementById('del-custom-range');
    if (el) el.style.display = 'none';
    window._deleteDbScopes = [];
    window._deleteDbDateRange = null;
}

function setupDeleteDateRangeToggle() {
    var range = document.getElementById('del-date-range');
    if (!range) return;
    range.addEventListener('change', function() {
        var custom = document.getElementById('del-custom-range');
        if (custom) custom.style.display = this.value === 'custom' ? 'block' : 'none';
    });
}

// SSE handler: data_deleted event - clear local state based on scope
function onDataDeleted(ev) {
    try {
        var payload = JSON.parse(ev.data);
        var scopes = payload.scope || [];
        if (scopes.includes('transactions')) { state.transactions = []; }
        if (scopes.includes('agents')) { state.agentRequests = []; state.agents = []; }
        if (scopes.includes('clients')) { state.clientRequests = []; state.clients = []; }
        if (scopes.includes('inventory')) {
            state.inventory = { totalGen: 0, availGen: 0, usedGen: 0, dieselFromAgents: 0, dieselFromSuppliers: 0 };
            state.orders = [];
        }
        if (scopes.includes('users')) { state.users = []; state.agents = []; }
        saveToLocalStorage();
        renderPage();
        setupDeleteDateRangeToggle();
        syncRemote();
    } catch (e) { /* ignore */ }
}

// REQUEST ORDER (Client)
// ========================
function renderRequestOrder() {
    const clientName = state.currentUser.name;
    const pricePerGen = getClientPriceFor(clientName);
    const availGen = state.inventory.availGen || 0;
    const clientObj = state.clients.find(function(c) { return c.name === clientName; }) || { balance: 0 };
    const maxAffordable = clientObj.balance > 0 ? Math.floor(clientObj.balance / pricePerGen) : 0;
    const orderableGen = Math.min(availGen, maxAffordable);
    const orderAmount = orderableGen * pricePerGen;

    return `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem;"><h2 style="font-size: 1.3rem; color: var(--white);">${t('titles.requestOrder')}</h2></div>
        <div class="widgets-grid" style="margin-bottom: 2rem;">
            <div class="widget"><div class="widget-header"><span class="widget-title">${t('agents.balance')}</span>💰</div><div class="widget-value">${formatCurrency(clientObj.balance)}</div></div>
            <div class="widget"><div class="widget-header"><span class="widget-title">${t('clients.maxOrderable')}</span>⛽</div><div class="widget-value text-green">${formatNumber(orderableGen)} GEN</div><div class="widget-change">${formatNumber(availGen)} GEN ${t('inventory.available')}</div></div>
            <div class="widget"><div class="widget-header"><span class="widget-title">${t('clients.orderAmount')}</span>💳</div><div class="widget-value">${formatCurrency(orderAmount)}</div><div class="widget-change">${formatCurrency(pricePerGen)} / GEN</div></div>
        </div>
        <div class="card"><h3 style="margin-bottom: 1rem; color: var(--white); font-size: 1.1rem;">${t('clients.enterGenQty')}</h3>
            <div class="form-grid">
                <div class="form-group"><label class="form-label">${t('table.quantity')} (GEN)</label><input type="text" class="input-field" id="client-order-qty" placeholder="${t('clients.enterGenQty')}" data-input="formatThousandsInput(this); updateClientOrderAmount()" inputmode="numeric" pattern="[0-9.]*"></div>
                <div class="form-group"><label class="form-label">${t('clients.totalToPay')}</label><div style="background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.6rem 0.85rem; color: var(--accent-green); font-weight: 600;" id="client-order-amount">Rp 0</div></div>
            </div>
            <div class="form-actions"><button class="btn btn-primary" data-action="submitClientOrder">${t('clients.requestSubmitted')}</button></div>
        </div>

        ${renderMyClientRequests()}
    </div>`;
}

function renderMyClientRequests() {
    const clientName = state.currentUser.name;
    const myReqs = (state.clientRequests || []).filter(function(r) { return r.clientName === clientName; });
    if (myReqs.length === 0) {
        return '<div class="card"><h3 style="margin-bottom: 1rem; color: var(--white); font-size: 1.1rem;">' + t('clients.myOrders') + '</h3><p style="color: var(--text-secondary); padding: 1rem;">' + t('alerts.noData') + '</p></div>';
    }
    let html = '<div class="card"><h3 style="margin-bottom: 1rem; color: var(--white); font-size: 1.1rem;">' + t('clients.myOrders') + '</h3>';
    html += '<div class="table-scrollable"><table><thead><tr><th>' + t('table.date') + '</th><th>' + t('table.quantity') + '</th><th>' + t('clients.totalToPay') + '</th><th>' + t('table.status') + '</th></tr></thead><tbody>';
    myReqs.forEach(function(req) {
        const statusClass = 'status-' + req.status;
        const statusLabel = req.status === 'pending' ? t('agents.orderPending') : req.status === 'approved' ? t('agents.orderApproved') : req.status === 'completed' ? t('agents.orderComplete') : req.status;
        html += '<tr><td>' + req.date + '</td><td>' + formatNumber(req.genQty) + ' GEN</td><td>' + formatCurrency(req.amount) + '</td><td><span class="status-badge ' + statusClass + '">' + statusLabel + '</span></td></tr>';
    });
    html += '</tbody></table></div></div>';
    return html;
}

async function submitClientOrder() {
    const qty = parseThousands(document.getElementById('client-order-qty').value);
    const clientName = state.currentUser.name;
    const pricePerGen = getClientPriceFor(clientName);
    const availGen = state.inventory.availGen || 0;
    const clientObj = state.clients.find(function(c) { return c.name === clientName; }) || { balance: 0 };
    const maxAffordable = clientObj.balance > 0 ? Math.floor(clientObj.balance / pricePerGen) : 0;

    if (!qty || qty <= 0) { alert(t('alerts.invalidQty')); return; }
    if (qty > availGen) { alert(t('alerts.insufficientDiesel')); return; }
    if (qty > maxAffordable) { alert(t('alerts.invalidQty')); return; }

    const amount = qty * pricePerGen;
    const orderDate = new Date().toISOString().split('T')[0];
    const serverOrder = await postRealtime('/api/orders', { type: 'sale', counterparty: clientName, qty: qty, rate: pricePerGen, amount: amount, requester_name: clientName });
    const orderId = (serverOrder && serverOrder.order && serverOrder.order.id) || Date.now();
    state.clientRequests = state.clientRequests || [];
    state.clientRequests.push({ id: orderId, clientId: state.clients.find(function(c) { return c.name === clientName; }) ? state.clients.find(function(c) { return c.name === clientName; }).id : orderId, clientName: clientName, genQty: qty, amount: amount, status: 'pending', date: orderDate, approvals: [] });
    saveToLocalStorage();
    alert(t('alerts.orderSubmitted') + '\n\n' + t('clients.clientName') + ': ' + clientName + '\n' + t('table.quantity') + ': ' + formatNumber(qty) + ' GEN\n' + t('clients.totalToPay') + ': ' + formatCurrency(amount));
    document.getElementById('client-order-qty').value = '';
}

// ========================
// REQUEST GEN (Agent)
// ========================
function renderRequestGen() {
    const agentName = state.currentUser.name;
    const profitPerGen = getAgentProfitPerGen();
    const dieselCostPerGen = getDieselCostForGen();
    const agentObj = state.agents.find(function(a) { return a.name === agentName; }) || { genQty: 0, dieselProvided: 0 };
    const agentTrans = state.transactions.filter(function(tr) { return tr.counterparty === agentName; });
    const completedGen = agentTrans.filter(function(tr) { return tr.type === 'purchase' && tr.status === 'completed'; }).reduce(function(sum, tr) { return sum + tr.qty; }, 0);
    const targetGen = agentObj.genQty || 0;
    const remainingGen = Math.max(0, targetGen - completedGen);
    const fulfillmentPercent = targetGen > 0 ? Math.round((completedGen / targetGen) * 100) : 0;
    const dieselProvided = agentObj.dieselProvided || (agentObj.genQty * state.prices.litersPerGen);

    return `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem;"><h2 style="font-size: 1.3rem; color: var(--white);">${t('titles.requestGen')}</h2></div>
        <div class="widgets-grid" style="margin-bottom: 2rem;">
            <div class="widget"><div class="widget-header"><span class="widget-title">${t('dashboard.myProfit')}</span>💰</div><div class="widget-value text-green">${formatCurrency(completedGen * profitPerGen)}</div><div class="widget-change change-positive">${formatCurrency(profitPerGen)} / GEN</div></div>
            <div class="widget"><div class="widget-header"><span class="widget-title">${t('dashboard.dieselProvided')}</span>⛽</div><div class="widget-value">${formatNumber(dieselProvided)} L</div></div>
            <div class="widget"><div class="widget-header"><span class="widget-title">${t('dashboard.quotaToFulfill')}</span>📊</div><div class="widget-value text-yellow">${formatNumber(remainingGen)} GEN</div><div class="widget-change change-positive">${completedGen} / ${targetGen} GEN (${fulfillmentPercent}%)</div></div>
        </div>
        <div class="table-container" style="margin-bottom: 2rem;">
            <div class="table-header"><div class="table-title">${t('dashboard.myTransactions')}</div><div class="table-actions">
                <select class="input-field" style="width: 140px; padding: 0.4rem 0.65rem; font-size: 0.8rem;" id="agent-trans-filter" data-change="filterAgentTransactions">
                    <option value="week">${t('alerts.week')}</option>
                    <option value="month">${t('alerts.month')}</option>
                    <option value="last_month">${t('alerts.lastMonth')}</option>
                </select>
            </div></div>
            <div class="table-scrollable"><table>
                <thead><tr><th>${t('table.date')}</th><th>${t('table.type')}</th><th>${t('table.quantity')}</th><th>${t('table.amount')}</th><th>${t('table.status')}</th></tr></thead>
                <tbody id="agent-trans-tbody">${renderAgentTransactions(agentName, 'week')}</tbody>
            </table></div>
        </div>
        <div class="card"><h3 style="margin-bottom: 1rem; color: var(--white); font-size: 1.1rem;">${t('agents.dieselRequest')}</h3><p style="color: var(--text-secondary); margin-bottom: 1rem;">${t('agents.requestQty')}: ${formatCurrency(state.prices.agentPricePerGen)} / GEN</p>
            <div class="form-grid">
                <div class="form-group"><label class="form-label">${t('table.quantity')} (GEN)</label><input type="text" class="input-field" id="agent-gen-request-qty" placeholder="${t('agents.enterQty')}" data-input="formatThousandsInput(this); updateGenRequestAmount()" inputmode="numeric" pattern="[0-9.]*"></div>
                <div class="form-group"><label class="form-label">${t('clients.totalToPay')}</label><div style="background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.6rem 0.85rem; color: var(--accent-green); font-weight: 600;" id="agent-gen-request-amount">Rp 0</div></div>
            </div>
            <div class="form-actions"><button class="btn btn-primary" data-action="submitGenRequest">${t('agents.sendRequest')}</button></div>
        </div>

        ${renderMyAgentRequests()}
    </div>`;
}

function renderMyAgentRequests() {
    const agentName = state.currentUser.name;
    const myReqs = (state.agentRequests || []).filter(function(r) { return r.agentName === agentName; });
    if (myReqs.length === 0) {
        return '<div class="card"><h3 style="margin-bottom: 1rem; color: var(--white); font-size: 1.1rem;">' + t('agents.myRequests') + '</h3><p style="color: var(--text-secondary); padding: 1rem;">' + t('alerts.noData') + '</p></div>';
    }
    let html = '<div class="card"><h3 style="margin-bottom: 1rem; color: var(--white); font-size: 1.1rem;">' + t('agents.myRequests') + '</h3>';
    html += '<div class="table-scrollable"><table><thead><tr><th>' + t('table.date') + '</th><th>' + t('table.quantity') + '</th><th>' + t('agents.requestedAmount') + '</th><th>' + t('agents.targetQty') + '</th><th>' + t('agents.deliveredQty') + '</th><th>' + t('agents.remainingToDeliver') + '</th><th>' + t('table.status') + '</th><th>' + t('table.actions') + '</th></tr></thead><tbody>';
    myReqs.forEach(function(req) {
        const prog = { target: req.genQty, delivered: req.deliveredQty || 0, remaining: Math.max(0, req.genQty - (req.deliveredQty || 0)) };
        const statusClass = 'status-' + req.status;
        const statusLabel = req.status === 'pending' ? t('agents.orderPending') : req.status === 'approved' ? t('agents.orderApproved') : req.status === 'delivered' ? t('agents.orderDelivered') : req.status === 'confirmed' ? t('agents.orderConfirmed') : req.status === 'verified' ? t('agents.verify') : req.status === 'completed' ? t('agents.orderComplete') : req.status === 'rejected' ? t('agents.rejected') : req.status;
        let actionHtml = '';
        if (req.status === 'approved' && prog.delivered < prog.target) {
            actionHtml = '<button class="btn btn-warning btn-xs" data-action="agentConfirmDelivery" data-args="' + req.id + '">' + t('agents.genDelivered') + '</button>';
        } else if (req.status === 'delivered' && prog.delivered < prog.target) {
            actionHtml = '<button class="btn btn-warning btn-xs" data-action="agentConfirmDelivery" data-args="' + req.id + '">' + t('agents.genDelivered') + '</button>';
        } else if (req.status === 'delivered') {
            actionHtml = '<span style="color:var(--text-tertiary);font-size:0.8rem;">' + t('agents.awaitingConfirm') + '</span>';
        } else if (req.status === 'confirmed' || req.status === 'verified' || req.status === 'completed') {
            actionHtml = '<span style="color:var(--text-tertiary);font-size:0.8rem;">' + formatNumber(prog.delivered) + '/' + formatNumber(prog.target) + ' GEN</span>';
        }
        html += '<tr><td>' + req.date + '</td><td>' + formatNumber(req.genQty) + ' GEN</td><td>' + formatCurrency(req.amount) + '</td><td>' + formatNumber(prog.target) + ' GEN</td><td>' + formatNumber(prog.delivered) + ' GEN</td><td>' + formatNumber(prog.remaining) + ' GEN</td><td><span class="status-badge ' + statusClass + '">' + statusLabel + '</span></td><td>' + actionHtml + '</td></tr>';
    });
    html += '</tbody></table></div></div>';
    return html;
}

function updateGenRequestAmount() {
    const qty = parseThousands(document.getElementById('agent-gen-request-qty').value) || 0;
    document.getElementById('agent-gen-request-amount').textContent = formatCurrency(qty * state.prices.agentPricePerGen);
}

function updateClientOrderAmount() {
    const qty = parseThousands(document.getElementById('client-order-qty').value) || 0;
    const clientName = state.currentUser.name;
    const pricePerGen = getClientPriceFor(clientName);
    document.getElementById('client-order-amount').textContent = formatCurrency(qty * pricePerGen);
}

function renderAgentTransactions(agentName, filter) {
    filter = filter || 'week';
    const now = new Date();
    let filtered = state.transactions.filter(function(tr) {
        return tr.counterparty === agentName && tr.type === 'purchase';
    });

    if (filter === 'week') { const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); filtered = filtered.filter(function(tr) { return new Date(tr.date) >= weekAgo; }); }
    else if (filter === 'month') { const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); filtered = filtered.filter(function(tr) { return new Date(tr.date) >= monthAgo; }); }
    else if (filter === 'last_month') { const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1); const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0); filtered = filtered.filter(function(tr) { return new Date(tr.date) >= lm && new Date(tr.date) <= lmEnd; }); }

    if (filtered.length === 0) { return '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);padding:2rem;">' + t('alerts.noData') + '</td></tr>'; }
    return filtered.map(function(tr) {
        return '<tr><td>' + tr.date + '</td><td><span class="text-yellow">🔽 ' + t('reports.purchase') + '</span></td><td>' + formatNumber(tr.qty) + ' GEN</td><td>' + formatCurrency(tr.amount) + '</td><td><span class="status-badge status-' + tr.status + '">' + tr.status + '</span></td></tr>';
    }).join('');
}

function filterAgentTransactions() {
    const filter = document.getElementById('agent-trans-filter').value;
    document.getElementById('agent-trans-tbody').innerHTML = renderAgentTransactions(state.currentUser.name, filter);
}

async function submitGenRequest() {
    const qty = parseInt(document.getElementById('agent-gen-request-qty').value);
    const agentName = state.currentUser.name;
    if (!qty || qty <= 0) { alert(t('alerts.invalidQty')); return; }
    const amount = qty * state.prices.agentPricePerGen;
    const orderDate = new Date().toISOString().split('T')[0];
    const serverOrder = await postRealtime('/api/orders', { type: 'gen', counterparty: agentName, qty: qty, rate: state.prices.agentPricePerGen, amount: amount, requester_name: agentName });
    const orderId = (serverOrder && serverOrder.order && serverOrder.order.id) || Date.now();
    state.agentRequests = state.agentRequests || [];
    state.agentRequests.push({
        id: orderId,
        agentId: state.agents.find(function(a) { return a.name === agentName; }) ? state.agents.find(function(a) { return a.name === agentName; }).id : orderId,
        agentName: agentName,
        genQty: qty,
        amount: amount,
        status: 'pending',
        deliveredQty: 0,
        date: new Date().toISOString().split('T')[0],
        approvals: []
    });
    saveToLocalStorage();
    alert(t('alerts.genRequestSubmitted') + '\n\n' + t('agents.agentName') + ': ' + agentName + '\n' + t('table.quantity') + ': ' + formatNumber(qty) + ' GEN\n' + t('clients.totalToPay') + ': ' + formatCurrency(amount));
    document.getElementById('agent-gen-request-qty').value = '';
    document.getElementById('agent-gen-request-amount').textContent = 'Rp 0';
}

// ========================
// PERSISTENCE
// ========================
function defaultUsers() {
    // Display-only fallback. Real credentials live ONLY in the backend
    // (auth.db, bcrypt-hashed) - never in localStorage.
    return [
        { id: 1, username: 'admin', name: 'Faisal Ahmad', email: 'faisal@genapp.com', role: 'admin', status: 'active', avatar: 'F' },
        { id: 2, username: 'citygarage', name: 'City Garage', email: 'citygarage@email.com', role: 'client', status: 'active', avatar: 'C' },
        { id: 3, username: 'ahmedtraders', name: 'Ahmed Traders', email: 'ahmed@traders.com', role: 'agent', status: 'active', avatar: 'A' }
    ];
}

function saveToLocalStorage() {
    localStorage.setItem('genapp_state', JSON.stringify({
        prices: state.prices,
        customPrices: state.customPrices,
        preferences: state.preferences,
        agents: state.agents,
        clients: state.clients,
        transactions: state.transactions,
        inventory: state.inventory,
        users: state.users || [],
        agentRequests: state.agentRequests || [],
        clientRequests: state.clientRequests || [],
        orderRequests: state.orderRequests || [],
        loggedIn: state.loggedIn || false,
        currentPage: state.currentPage || 'login',
        currentUser: state.currentUser || null
    }));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('genapp_state');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.prices) Object.assign(state.prices, data.prices);
            if (data.customPrices) Object.assign(state.customPrices, data.customPrices || {});
            if (data.preferences) Object.assign(state.preferences, data.preferences);
            if (data.agents) state.agents = data.agents;
            if (data.clients) state.clients = data.clients;
            if (data.transactions) state.transactions = data.transactions;
            if (data.inventory) Object.assign(state.inventory, data.inventory);
            if (data.users) state.users = data.users;
            if (data.agentRequests) state.agentRequests = data.agentRequests;
            if (data.clientRequests) state.clientRequests = data.clientRequests;
            if (data.orderRequests) state.orderRequests = data.orderRequests;
            if (data.loggedIn !== undefined) state.loggedIn = data.loggedIn;
            if (data.currentPage) state.currentPage = data.currentPage;
            if (data.currentUser) state.currentUser = data.currentUser;
        } catch(e) { console.error('Failed to load state', e); }
    }
    if (!state.users || state.users.length === 0 || !state.users[0].username) {
        state.users = defaultUsers();
        state.loggedIn = false;
    }
}

function saveSettings() {
    state.prices.clientPricePerGen = parseThousands(document.getElementById('client-price').value);
    state.prices.agentPricePerGen = parseThousands(document.getElementById('agent-price').value);
    state.prices.supplierPricePerGen = parseThousands(document.getElementById('supplier-price').value);
    state.prices.dieselPricePerLiter = parseThousands(document.getElementById('diesel-price').value);
    state.prices.litersPerGen = parseThousands(document.getElementById('liters-per-gen').value);
    saveToLocalStorage();
    alert(t('alerts.settingsSaved') + '\n\n' + t('alerts.newProfitMargin') + (state.prices.clientPricePerGen - state.prices.agentPricePerGen).toLocaleString('id-ID') + ' / GEN');
}

function savePreferences() {
    state.preferences.currency = document.getElementById('pref-currency').value;
    state.preferences.measurementUnit = document.getElementById('pref-measurement').value;
    state.preferences.language = document.getElementById('pref-language').value;
    state.preferences.dateFormat = document.getElementById('pref-date-format').value;
    saveToLocalStorage();
    alert(t('alerts.prefsSaved'));
    renderSidebar();
    renderPage();
}

function resetSettings() {
    state.prices.clientPricePerGen = 480000;
    state.prices.agentPricePerGen = 450000;
    state.prices.supplierPricePerGen = 470000;
    state.prices.dieselPricePerLiter = 6800;
    state.prices.litersPerGen = 33;
    if (document.getElementById('client-price')) document.getElementById('client-price').value = formatNumber(480000);
    if (document.getElementById('agent-price')) document.getElementById('agent-price').value = formatNumber(450000);
    if (document.getElementById('supplier-price')) document.getElementById('supplier-price').value = formatNumber(470000);
    if (document.getElementById('diesel-price')) document.getElementById('diesel-price').value = formatNumber(6800);
    if (document.getElementById('liters-per-gen')) document.getElementById('liters-per-gen').value = formatNumber(33);
    alert(t('alerts.settingsReset'));
}

function updateCustomTargetOptions() {
    const type = document.getElementById('custom-target-type').value;
    const select = document.getElementById('custom-target-account');
    let options = '';
    if (type === 'client') { options = state.clients.map(function(c) { return '<option value="' + c.name + '">' + escapeHtml(c.name) + '</option>'; }).join(''); }
    else if (type === 'agent') { options = state.agents.map(function(a) { return '<option value="' + a.name + '">' + escapeHtml(a.name) + '</option>'; }).join(''); }
    else { options = '<option>Global Fuel Supplier</option>'; }
    select.innerHTML = options;
}

function saveCustomPrice() {
    const account = document.getElementById('custom-target-account').value;
    const price = document.getElementById('custom-price').value;
    if (!price) { delete state.customPrices[account]; alert(t('alerts.customPriceCleared')); }
    else { state.customPrices[account] = parseFloat(price); alert(t('alerts.customPriceSaved')); }
}

// ========================
// INITIALIZATION
// ========================
async function fetchUsers() {
    try {
        const resp = await fetch('/api/users', { credentials: 'same-origin' });
        if (resp.ok) {
            const data = await resp.json();
            if (Array.isArray(data.users)) { state.users = data.users; saveToLocalStorage(); }
        }
    } catch (e) { /* offline: keep cached users */ }
}

// ========================
// REMOTE ORDERS / TRANSACTIONS SYNC (backend + SSE)
// ========================
async function postRealtime(url, data) {
  try {
    const r = await fetch(url, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data || {}) });
    if (r.ok) return await r.json();
  } catch (e) { /* backend down/offline: caller falls back to local state */ }
  return null;
}
// PATCH an order's status/delivered_qty (approve/deliver/verify/complete/fulfill) -> persisted + broadcast to all roles.
async function postOrderPatch(id, patch) {
  try {
    const r = await fetch('/api/orders/' + id, { method: 'PATCH', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch || {}) });
    if (r.ok) return await r.json();
  } catch (e) { /* backend down/offline: caller falls back to local state */ }
  return null;
}
// Delete a transaction (try backend DELETE API; fall back to local removal)
async function deleteTransaction(id) {
  if (!confirm(t('alerts.deleteConfirm'))) return;
  try { await fetch('/api/transactions/' + id, { method: 'DELETE', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(5000) }); } catch(e) {}
  state.transactions = (state.transactions || []).filter(function(tx) { return tx.id !== id; });
  saveToLocalStorage();
  renderPage();
}
// Delete an agent request (order with requester_role='agent')
async function deleteAgentRequest(reqId) {
  if (!confirm(t('alerts.deleteConfirm'))) return;
  try { await fetch('/api/orders/' + reqId, { method: 'DELETE', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(5000) }); } catch(e) {}
  state.agentRequests = (state.agentRequests || []).filter(function(r) { return r.id !== reqId; });
  state.clientRequests = (state.clientRequests || []).filter(function(r) { return r.id !== reqId; });
  saveToLocalStorage();
  renderPage();
}
// Delete a client order request (order with requester_role='client'/type='sale')
async function deleteClientOrder(reqId) {
  if (!confirm(t('alerts.deleteConfirm'))) return;
  try { await fetch('/api/orders/' + reqId, { method: 'DELETE', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(5000) }); } catch(e) {}
  state.clientRequests = (state.clientRequests || []).filter(function(r) { return r.id !== reqId; });
  saveToLocalStorage();
  renderPage();
}
// Delete a user (admin only)
async function deleteUser(id) {
  if (!confirm(t('alerts.deleteConfirm'))) return;
  try { await fetch('/api/users/' + id, { method: 'DELETE', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(5000) }); } catch(e) {}
  state.users = (state.users || []).filter(function(u) { return u.id !== id; });
  saveToLocalStorage();
  renderPage();
}
// Pull the shared order + transaction ledger from the backend (server = source of truth).
async function syncRemote() {
  try {
    const or = await fetch('/api/orders', { credentials: 'same-origin' });
    if (or.ok) {
      const { orders } = await or.json();
      if (Array.isArray(orders)) {
        state.clientRequests = orders.filter(function(o) { return (o.requester_role || o.role) === 'client'; }).map(function(o) {
          const c = state.clients.find(function(c) { return c.name === o.counterparty; });
          return { id: o.id, clientId: c ? c.id : o.id, clientName: o.counterparty, genQty: o.qty, amount: o.amount, status: o.status || 'pending', date: o.created_at, approvals: [] };
        });
        state.agentRequests = orders.filter(function(o) { return (o.requester_role || o.role) === 'agent'; }).map(function(o) {
          const a = state.agents.find(function(a) { return a.name === o.counterparty; });
          return { id: o.id, agentId: a ? a.id : o.id, agentName: o.counterparty, genQty: o.qty, amount: o.amount, status: o.status || 'pending', deliveredQty: o.delivered_qty || 0, date: o.created_at, approvals: [] };
        });
      }
    }
  } catch (e) { /* offline: keep cached requests */ }
  try {
    const tr = await fetch('/api/transactions', { credentials: 'same-origin' });
    if (tr.ok) {
      const { transactions } = await tr.json();
      if (Array.isArray(transactions)) state.transactions = transactions.map(function(tx) {
        return { id: tx.id, type: tx.type, counterparty: tx.counterparty, qty: tx.qty, unit: tx.unit || 'gen', rate: tx.rate, amount: tx.amount, status: tx.status || 'completed', date: tx.date };
      });
    }
  } catch (e) { /* offline: keep cached transactions */ }
  // Sync users (admin only) — ensures agents/users list matches backend after delete
  if (state.currentUser && state.currentUser.role === 'admin') {
    try {
      const ur = await fetch('/api/users', { credentials: 'same-origin' });
      if (ur.ok) {
        const { users } = await ur.json();
        if (Array.isArray(users)) state.users = users;
      }
    } catch (e) { /* offline: keep cached users */ }
  }
  // Sync agents list with backend users — removes stale agents after Delete Database
  if (Array.isArray(state.users)) {
    var userNames = {};
    state.users.forEach(function(u) { if (u.role === 'agent' || u.role === 'city') userNames[u.name] = true; });
    state.agents = state.agents.filter(function(a) { return userNames[a.name]; });
  }
  saveToLocalStorage();
  renderPage();
}
// SSE: subscribe to live order/transaction events so every role sees them in realtime.
let realtimeSources = [];
function subscribeRealtime() {
  if (typeof EventSource === 'undefined') return; // browser-only
  try {
    // tear down any prior SSE connections (re-login, or before logout)
    realtimeSources.forEach(function(es) { try { es.close(); } catch (e2) {} });
    realtimeSources = [];
    const es = new EventSource('/api/orders/stream');
    es.addEventListener('order', onRealtimeOrder);
    es.addEventListener('order_delete', onRealtimeOrderDelete);
    es.addEventListener('data_deleted', onDataDeleted);
    es.onerror = function() {};
    const et = new EventSource('/api/transactions/stream');
    et.addEventListener('transaction', onRealtimeTransaction);
    et.addEventListener('transaction_delete', onRealtimeTransactionDelete);
    et.addEventListener('data_deleted', onDataDeleted);
    et.onerror = function() {};
    realtimeSources.push(es, et);
  } catch (e) { /* SSE unavailable */ }
}
function onRealtimeOrder(ev) {
  try {
    const o = JSON.parse(ev.data);
    const isClient = (o.requester_role || o.role) === 'client';
    const target = isClient ? (state.clientRequests = state.clientRequests || []) : (state.agentRequests = state.agentRequests || []);
    const existing = target.find(function(r) { return r.id === o.id; });
    if (existing) {
      // status change (approve/deliver/verify/complete/fulfill) broadcast by another role -> merge into the existing request
      if (o.status) existing.status = o.status;
      if (o.delivered_qty != null) existing.deliveredQty = o.delivered_qty;
      saveToLocalStorage();
      renderPage();
    } else {
      if (isClient) {
        const c = state.clients.find(function(c) { return c.name === o.counterparty; });
        target.push({ id: o.id, clientId: c ? c.id : o.id, clientName: o.counterparty, genQty: o.qty, amount: o.amount, status: o.status || 'pending', date: o.created_at, approvals: [] });
      } else {
        const a = state.agents.find(function(a) { return a.name === o.counterparty; });
        target.push({ id: o.id, agentId: a ? a.id : o.id, agentName: o.counterparty, genQty: o.qty, amount: o.amount, status: o.status || 'pending', deliveredQty: o.delivered_qty || 0, date: o.created_at, approvals: [] });
      }
      saveToLocalStorage();
      renderPage();
    }
  } catch (e) { /* malformed event */ }
}
function onRealtimeTransaction(ev) {
  try {
    const tx = JSON.parse(ev.data);
    if (state.transactions.find(function(t) { return t.id === tx.id; })) return; // dedupe
    state.transactions.push({ id: tx.id, type: tx.type, counterparty: tx.counterparty, qty: tx.qty, unit: tx.unit || 'gen', rate: tx.rate, amount: tx.amount, status: tx.status || 'completed', date: tx.date });
    saveToLocalStorage();
    renderPage();
  } catch (e) { /* malformed event */ }
}
// SSE delete events: remove the record from local state across all roles
function onRealtimeOrderDelete(ev) {
  try {
    const o = JSON.parse(ev.data);
    state.agentRequests = (state.agentRequests || []).filter(function(r) { return r.id !== o.id; });
    state.clientRequests = (state.clientRequests || []).filter(function(r) { return r.id !== o.id; });
    saveToLocalStorage();
    renderPage();
  } catch (e) { /* malformed event */ }
}
function onRealtimeTransactionDelete(ev) {
  try {
    const tx = JSON.parse(ev.data);
    state.transactions = (state.transactions || []).filter(function(t) { return t.id !== tx.id; });
    saveToLocalStorage();
    renderPage();
  } catch (e) { /* malformed event */ }
}

// Server-side session gate: ask the backend who we are (httpOnly cookie).
async function initAuth() {
    // sanitize any stale plaintext credentials left by the old client-only build
    if (Array.isArray(state.users)) {
        state.users = state.users.map(function(u) {
            const clean = {};
            for (const k in u) { if (k !== 'password' && k !== 'password_hash') clean[k] = u[k]; }
            return clean;
        });
    }
    try {
        const resp = await fetch('/api/me', { credentials: 'same-origin' });
        if (resp.ok) {
            const data = await resp.json();
            if (data.user) {
                state.loggedIn = true;
                state.currentUser = { id: data.user.id, username: data.user.username, name: data.user.name, role: data.user.role, avatar: data.user.avatar };
                if (data.user.role === 'admin') { await fetchUsers(); }
                await syncRemote();
                subscribeRealtime();
                if (!state.currentPage || state.currentPage === 'login') { state.currentPage = 'dashboard'; }
                saveToLocalStorage();
                return;
            }
        }
    } catch (e) { /* backend down/offline -> show login, never auto-login */ }
    state.loggedIn = false;
    state.currentUser = { id: null, username: null, name: 'Guest', role: '', avatar: '?' };
    state.currentPage = 'login';
}


// Register service worker (moved from inline <script> to satisfy CSP)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(function(e) {
        console.error('SW register failed:', e);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    // Render immediately so user sees content while auth check runs
    renderPage();
    initAuth().then(function() {
        updateHeader();
        renderSidebar();
        renderPage();
        updateNav();
    });
});

document.addEventListener('click', function(e) {
    if (!e.target.closest('.header-right')) {
        document.getElementById('profile-dropdown').classList.remove('show');
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') { closeAddModal(); document.getElementById('profile-dropdown').classList.remove('show'); }
});


// ===================================================================
// MODULE COMPATIBILITY SHIM  (migration midpoint - safe, behavior-identical)
// ===================================================================
// app.js runs as an ES module (type="module"), so its top-level functions
// are module-scoped and NOT visible to inline onclick/onchange/oninput
// content-attribute handlers (emitted by the render*() templates via
// innerHTML), which resolve names against `window`.
//
// To preserve every existing handler WITHOUT rewriting all ~120 of them,
// expose only the entry points those inline handlers actually call onto
// `window`. (Audit: 47 distinct call sites - loginUser + saveUserEdit added).)
//
// CSP-safe event delegation + module compatibility shim.
// (Inline onclick removed; replaced with data-action + delegated click listener.)

// ===================================================================
// CSP-SAFE EVENT DELEGATION
// ===================================================================
// VibeKit's Cloudflare CSP sets script-src-attr 'none', which blocks all
// inline data-action="..." handlers. We replace them with data-action="fnName"
// data-args="arg1, arg2" attributes and use a single delegated click listener.
//
// Supported arg formats:
//   data-action="loginUser"                      -> loginUser()
//   data-action="editUser" data-args="123"       -> editUser(123)
//   data-action="editUser" data-args="' + id + '" -> editUser(id)  (dynamic)
// ===================================================================
// ===================================================================
// CSP-SAFE EVENT DELEGATION
// ===================================================================
// VibeKit's Cloudflare CSP sets script-src-attr 'none', blocking all
// inline event handlers (onclick, onchange, oninput). We replace them
// with data-action / data-change / data-input attributes and use a single
// delegated listener. Multi-function calls (separated by ;) are supported.
// `this` in data-args is replaced with the element reference.
// ===================================================================

function _evalArgs(argsStr, el) {
    var expr = argsStr.replace(/\bthis\b/g, 'el');
    return eval('(' + expr + ')');
}

function _invokeHandler(handlerStr, el, eventName) {
    var fnCalls = handlerStr.split(';').filter(function(c) { return c.trim(); });
    fnCalls.forEach(function(call) {
        call = call.trim();
        var m = call.match(/^(\w+)\s*\((.*)\)\s*$/);
        if (m) {
            var fn = m[1], argsExpr = m[2].trim();
            if (window[fn] && typeof window[fn] === 'function') {
                try {
                    if (argsExpr) {
                        var parsed = _evalArgs(argsExpr, el);
                        if (Array.isArray(parsed)) window[fn].apply(null, parsed);
                        else if (parsed !== undefined) window[fn].call(null, parsed);
                        else window[fn]();
                    } else {
                        window[fn]();
                    }
                } catch(e) { console.error(eventName + ' ' + fn + ' failed:', e); }
            }
        } else {
            if (window[call] && typeof window[call] === 'function') { try { window[call](); } catch(e) {} }
        }
    });
}

document.addEventListener('click', function(e) {
    var target = e.target;
    while (target && target !== document) {
        if (target.hasAttribute && target.hasAttribute('data-action')) {
            e.preventDefault();
            e.stopPropagation();
            var action = target.getAttribute('data-action');
            var argsStr = target.getAttribute('data-args') || '';
            if (argsStr) _invokeHandler(action + '(' + argsStr + ')', target, 'click');
            else _invokeHandler(action, target, 'click');
            return;
        }
        target = target.parentElement;
    }
});

document.addEventListener('change', function(e) {
    var target = e.target;
    while (target && target !== document) {
        if (target.hasAttribute && target.hasAttribute('data-change')) {
            var action = target.getAttribute('data-change');
            var argsStr = target.getAttribute('data-args') || '';
            if (argsStr) _invokeHandler(action + '(' + argsStr + ')', target, 'change');
            else _invokeHandler(action, target, 'change');
        }
        target = target.parentElement;
    }
});

document.addEventListener('input', function(e) {
    var target = e.target;
    while (target && target !== document) {
        if (target.hasAttribute && target.hasAttribute('data-input')) {
            var action = target.getAttribute('data-input');
            var argsStr = target.getAttribute('data-args') || '';
            if (argsStr) _invokeHandler(action + '(' + argsStr + ')', target, 'input');
            else _invokeHandler(action, target, 'input');
        }
        target = target.parentElement;
    }
});

const _inlineApi = {
    toggleSidebar,
    toggleProfileDropdown,
    switchUser,
    logoutWithConfirm,
    loginUser,
    closeAddModal,
    submitAddModal,
    navigateTo,
    showAddTransactionModal,
    submitAddTransaction,
    editTransaction,
    saveTransactionEdit,
    filterTransactions,
    clearTransactionFilters,
    showAddAgentModal,
    submitAddAgent,
    viewAgentDetails,
    payAgent,
    submitAgentPayment,
    submitAgentRequest,
    approveAgentRequest,
    verifyAgentDelivery,
    agentConfirmDelivery,
    verifyAgentFulfillment,
    completeAgentOrder,
    deleteTransaction,
    deleteAgentRequest,
    deleteClientOrder,
    deleteUser,
    onRealtimeOrderDelete,
    onRealtimeTransactionDelete,
    showAddClientModal,
    submitAddClient,
    viewClientOrders,
    approveClientOrder,
    fulfillClientOrder,
    submitClientOrder,
    updateClientOrderAmount,
    filterReports,
    exportToExcel,
    filterAgentTransactions,
    showAddUserModal,
    submitAddUser,
    saveUserEdit,
    editUser,
    filterUsers,
    clearUserFilters,
    saveSettings,
    resetSettings,
    showDeleteDatabaseConfirm,
    deleteDatabase,
    cancelDeleteDatabase,
    setupDeleteDateRangeToggle,
    onDataDeleted,
    savePreferences,
    updateGenRequestAmount,
    submitGenRequest,
    formatThousandsInput,
};
Object.assign(window, _inlineApi);
