(function() {
    let trackingData = [];
    let lastSentTime = Date.now();
    const SEND_INTERVAL = 5000; // 5 giây gửi 1 lần
    const TRACKING_URL = "https://n8n.twin.vn/webhook/495eaa71-b6e0-4402-9b6d-22b1e796e8d1"; 

    function trackEvent(eventType, details) {
        trackingData.push({
            event: eventType,
            details: details,
            timestamp: new Date().toISOString()
        });

        if (Date.now() - lastSentTime > SEND_INTERVAL) {
            sendBatchData();
            lastSentTime = Date.now();
        }
    }

    function sendBatchData() {
        if (trackingData.length === 0) return;

        fetch(TRACKING_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ events: trackingData })
        })
        .then(response => console.log("✅ Tracking batch sent"))
        .catch(error => console.error("❌ Tracking failed:", error));

        trackingData = [];
    }

    setInterval(sendBatchData, SEND_INTERVAL);

    document.addEventListener("click", (event) => {
        if (event.target.tagName === "BUTTON") {
            trackEvent("click", { element: event.target.innerText });
        }
    });

    document.addEventListener("scroll", () => {
        if (window.scrollY > document.body.scrollHeight * 0.5) {
            trackEvent("scroll", { scrollY: window.scrollY });
        }
    });
})();
