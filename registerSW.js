if('serviceWorker' in navigator) {window.addEventListener('load', () => {navigator.serviceWorker.register('/aha-daily-diary-/sw.js', { scope: '/aha-daily-diary-/' })})}