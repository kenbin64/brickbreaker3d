// ═══════════════════════════════════════════════════════════════════════════════
// 🔐 BUTTERFLYFX AUTHENTICATION SYSTEM
// Role-based access control: Superuser → Admin → User
// No if-statements - dimensional role manifestation
// ═══════════════════════════════════════════════════════════════════════════════

const ButterflyAuth = (() => {
    'use strict';
    
    // 🌊 Role hierarchy manifold
    const ROLES = {
        SUPERUSER: { level: 3, name: 'Superuser', color: '#ff0000' },
        ADMIN: { level: 2, name: 'Admin', color: '#ff00ff' },
        USER: { level: 1, name: 'User', color: '#00ffff' },
        GUEST: { level: 0, name: 'Guest', color: '#00ff00' }
    };
    
    // 🎮 Free games (no login required)
    const FREE_GAMES = [
        'void-breaker',
        'wave-defense',
        'asteroid-field'
    ];
    
    // 🔒 Premium games (login required)
    const PREMIUM_GAMES = [
        'fasttrack',
        'dim-chess',
        'neon-racer',
        'helix-puzzle',
        'star-forge'
    ];
    
    // 📍 Current user state
    let currentUser = null;
    
    // 🌊 Initialize auth system
    const init = () => {
        // Load user from localStorage
        const savedUser = localStorage.getItem('butterflyfx_user');
        currentUser = savedUser ? JSON.parse(savedUser) : null;
        
        // Check if superuser exists, if not create default
        const users = getUsers();
        const hasSuperuser = users.some(u => u.role === 'SUPERUSER');
        
        if (!hasSuperuser) {
            createDefaultSuperuser();
        }
    };
    
    // 👑 Create default superuser
    const createDefaultSuperuser = () => {
        const superuser = {
            id: generateId(),
            username: 'admin',
            email: 'admin@kensgames.com',
            password: hashPassword('admin123'), // Change this!
            role: 'SUPERUSER',
            createdAt: Date.now(),
            lastLogin: null
        };
        
        const users = getUsers();
        users.push(superuser);
        saveUsers(users);
        
        console.log('🔐 Default superuser created: admin / admin123');
        console.log('⚠️ CHANGE PASSWORD IMMEDIATELY!');
    };
    
    // 🔑 Login
    const login = (username, password) => {
        const users = getUsers();
        const user = users.find(u => u.username === username);
        
        if (!user) {
            return { success: false, error: 'User not found' };
        }
        
        if (user.password !== hashPassword(password)) {
            return { success: false, error: 'Invalid password' };
        }
        
        // Update last login
        user.lastLogin = Date.now();
        saveUsers(users);
        
        // Save to session
        currentUser = user;
        localStorage.setItem('butterflyfx_user', JSON.stringify(user));
        
        return { success: true, user };
    };
    
    // 📝 Register new user
    const register = (username, email, password) => {
        const users = getUsers();
        
        // Check if username exists
        if (users.some(u => u.username === username)) {
            return { success: false, error: 'Username already exists' };
        }
        
        // Check if email exists
        if (users.some(u => u.email === email)) {
            return { success: false, error: 'Email already exists' };
        }
        
        const newUser = {
            id: generateId(),
            username,
            email,
            password: hashPassword(password),
            role: 'USER',
            createdAt: Date.now(),
            lastLogin: null
        };
        
        users.push(newUser);
        saveUsers(users);
        
        return { success: true, user: newUser };
    };
    
    // 🚪 Logout
    const logout = () => {
        currentUser = null;
        localStorage.removeItem('butterflyfx_user');
    };
    
    // 👤 Get current user
    const getCurrentUser = () => currentUser;
    
    // 🎯 Check if user has access to game
    const canPlayGame = (gameId) => {
        // Free games are always accessible
        if (FREE_GAMES.includes(gameId)) {
            return true;
        }
        
        // Premium games require login
        return currentUser !== null;
    };
    
    // 🔐 Check role permission
    const hasRole = (requiredRole) => {
        if (!currentUser) return false;
        return ROLES[currentUser.role].level >= ROLES[requiredRole].level;
    };
    
    // 📊 Get all users (Admin+ only)
    const getUsers = () => {
        const usersJson = localStorage.getItem('butterflyfx_users');
        return usersJson ? JSON.parse(usersJson) : [];
    };
    
    // 💾 Save users
    const saveUsers = (users) => {
        localStorage.setItem('butterflyfx_users', JSON.stringify(users));
    };
    
    // 🔨 Simple hash function (use bcrypt in production!)
    const hashPassword = (password) => {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    };
    
    // 🆔 Generate unique ID
    const generateId = () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };
    
    // 🌊 Export public API
    return {
        init,
        login,
        register,
        logout,
        getCurrentUser,
        canPlayGame,
        hasRole,
        getUsers,
        saveUsers,
        ROLES,
        FREE_GAMES,
        PREMIUM_GAMES
    };
})();

