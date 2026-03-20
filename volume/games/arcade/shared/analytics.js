// ═══════════════════════════════════════════════════════════════════════════════
// 📊 BUTTERFLYFX ANALYTICS INTEGRATION
// Google Analytics 4 + Custom Event Tracking
// Account: kenetics.art@gmail.com
// ═══════════════════════════════════════════════════════════════════════════════

const ButterflyAnalytics = (() => {
    'use strict';
    
    // 🎯 Google Analytics Measurement ID
    // TODO: Replace with your actual GA4 Measurement ID from Google Analytics
    const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // Get this from analytics.google.com
    
    // 🌊 Initialize Google Analytics
    const init = () => {
        // Load Google Analytics script
        const script1 = document.createElement('script');
        script1.async = true;
        script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
        document.head.appendChild(script1);
        
        // Initialize gtag
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        
        gtag('js', new Date());
        gtag('config', GA_MEASUREMENT_ID, {
            send_page_view: true,
            cookie_flags: 'SameSite=None;Secure'
        });
        
        console.log('📊 Google Analytics initialized');
    };
    
    // 🎮 Track game start
    const trackGameStart = (gameName, userId = null) => {
        window.gtag?.('event', 'game_start', {
            game_name: gameName,
            user_id: userId,
            timestamp: Date.now()
        });
        
        console.log(`📊 Game Start: ${gameName}`);
    };
    
    // 🏆 Track game end
    const trackGameEnd = (gameName, score, duration, userId = null) => {
        window.gtag?.('event', 'game_end', {
            game_name: gameName,
            score: score,
            duration_seconds: duration,
            user_id: userId,
            timestamp: Date.now()
        });
        
        console.log(`📊 Game End: ${gameName} - Score: ${score}`);
    };
    
    // 🎯 Track level complete
    const trackLevelComplete = (gameName, level, score, userId = null) => {
        window.gtag?.('event', 'level_complete', {
            game_name: gameName,
            level: level,
            score: score,
            user_id: userId,
            timestamp: Date.now()
        });
        
        console.log(`📊 Level Complete: ${gameName} - Level ${level}`);
    };
    
    // 💀 Track game over
    const trackGameOver = (gameName, finalScore, highScore, userId = null) => {
        window.gtag?.('event', 'game_over', {
            game_name: gameName,
            final_score: finalScore,
            high_score: highScore,
            user_id: userId,
            timestamp: Date.now()
        });
        
        console.log(`📊 Game Over: ${gameName} - Final Score: ${finalScore}`);
    };
    
    // 🔐 Track login
    const trackLogin = (username, role) => {
        window.gtag?.('event', 'login', {
            method: 'butterflyfx_auth',
            username: username,
            role: role,
            timestamp: Date.now()
        });
        
        console.log(`📊 Login: ${username} (${role})`);
    };
    
    // 📝 Track signup
    const trackSignup = (username, role) => {
        window.gtag?.('event', 'sign_up', {
            method: 'butterflyfx_auth',
            username: username,
            role: role,
            timestamp: Date.now()
        });
        
        console.log(`📊 Signup: ${username}`);
    };
    
    // 🚪 Track logout
    const trackLogout = (username) => {
        window.gtag?.('event', 'logout', {
            username: username,
            timestamp: Date.now()
        });
        
        console.log(`📊 Logout: ${username}`);
    };
    
    // 🎯 Track custom event
    const trackEvent = (eventName, params = {}) => {
        window.gtag?.('event', eventName, {
            ...params,
            timestamp: Date.now()
        });
        
        console.log(`📊 Event: ${eventName}`, params);
    };
    
    // 📄 Track page view
    const trackPageView = (pagePath, pageTitle) => {
        window.gtag?.('event', 'page_view', {
            page_path: pagePath,
            page_title: pageTitle,
            timestamp: Date.now()
        });
        
        console.log(`📊 Page View: ${pageTitle}`);
    };
    
    // 🎮 Track button click
    const trackButtonClick = (buttonName, location) => {
        window.gtag?.('event', 'button_click', {
            button_name: buttonName,
            location: location,
            timestamp: Date.now()
        });
        
        console.log(`📊 Button Click: ${buttonName}`);
    };
    
    // 💎 Track achievement unlock
    const trackAchievement = (achievementName, gameName, userId = null) => {
        window.gtag?.('event', 'achievement_unlock', {
            achievement_name: achievementName,
            game_name: gameName,
            user_id: userId,
            timestamp: Date.now()
        });
        
        console.log(`📊 Achievement: ${achievementName}`);
    };
    
    // 🌊 Export public API
    return {
        init,
        trackGameStart,
        trackGameEnd,
        trackLevelComplete,
        trackGameOver,
        trackLogin,
        trackSignup,
        trackLogout,
        trackEvent,
        trackPageView,
        trackButtonClick,
        trackAchievement
    };
})();

