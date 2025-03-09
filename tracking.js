(function() {
    console.log("Tracking script loaded and executing...");

    // Đảm bảo Webhook chỉ được gọi nếu trang đã hoàn tất tải
    document.addEventListener("DOMContentLoaded", function() {
        fetch("https://n8n.twin.vn/webhook/495eaa71-b6e0-4402-9b6d-22b1e796e8d1", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
                event: "page_view", 
                url: window.location.href, 
                timestamp: new Date().toISOString() 
            })
        })
        .then(response => response.json())
        .then(data => console.log("Webhook response:", data))
        .catch(error => console.error("Error:", error));
    });
})();
