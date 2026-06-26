if (typeof io !== 'undefined') {
    const socket = io();

    socket.on('connect', () => {
        console.log('⚡ Socket.io connected successfully! ID:', socket.id);
        if (typeof syncWithServerRealtime === 'function') {
            syncWithServerRealtime();
        }
    });

    socket.on('disconnect', (reason) => {
        console.warn('❌ Socket.io disconnected! Reason:', reason);
    });

    socket.on('connect_error', (error) => {
        console.error('❌ Socket.io connection error:', error);
    });

    socket.on('data-changed', (data) => {
        console.log('📡 تحديث لحظي مستلم:', data);
        if (typeof syncWithServerRealtime === 'function') {
            syncWithServerRealtime(data);
        }
    });
} else {
    console.warn('⚠️ Socket.io library (io) is not defined. Realtime updates disabled.');
}
