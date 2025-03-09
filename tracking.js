(function() {
    console.log("Tracking script loaded and executing...");

    function getDeviceInfo() {
        const ua = navigator.userAgent;
        let os = "Unknown OS", browser = "Unknown Browser";

        if (ua.indexOf("Win") !== -1) os = "Windows";
        else if (ua.indexOf("Mac") !== -1) os = "MacOS";
        else if (ua.indexOf("Linux") !== -1) os = "Linux";
        else if (ua.indexOf("Android") !== -1) os = "Android";
        else if (ua.indexOf("iPhone") !== -1) os = "iOS";

        if (ua.indexOf("Chrome") !== -1) browser = "Chrome";
        else if (ua.indexOf("Firefox") !== -1) browser = "Firefox";
        else if (ua.indexOf("Safari") !== -1) browser = "Safari";
        else if (ua.indexOf("Edge") !== -1) browser = "Edge";

        return { os, browser };
    }

    document.addEventListener("DOMContentLoaded", function() {
        fetch("https://api64.ipify.org?format=json")
        .then(response => response.json())
        .then(ipData => {
            const userIP = ipData.ip;
            const deviceInfo = getDeviceInfo();

            fetch("https://n8n.twin.vn/webhook/495eaa71-b6e0-4402-9b6d-22b1e796e8d1", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    event: "page_view", 
                    url: window.location.href, 
                    ip: userIP, 
                    device: deviceInfo,
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
