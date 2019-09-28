(function () {
    $(document).ready(function () {
        const currentTimer = document.getElementById("currentTime")
        const svgContainer_style = getComputedStyle(svgContainer);
        let windowWidth = parseInt(svgContainer_style.getPropertyValue('width'));
        let windowHeight = window.innerHeight;
        let d = new Date();
        let interval = 1000;
        let intervalId;

        d3Scripts.setDate(d.getDay(), d.getHours() - 7, d.getMinutes() - 20, d.getSeconds(), interval);
        d3Scripts.init(windowWidth, windowHeight);

        startInterval(interval);

        function startInterval(_interval) {
            intervalId = setInterval(() => {
                d.setTime(d.getTime() + 1000);
                currentTimer.innerHTML = d.toLocaleTimeString();
                d3Scripts.setDate(d.getDay(), d.getHours() - 11, d.getMinutes() - 10, d.getSeconds(), interval)
            }, _interval);
        }

        $("#btnSwitchView").click(function (e) {
            d3Scripts.switchViewStyle();
        });

        $("#btnResetTime").click(function (e) {
            d = new Date();
        });

        $("#btnForward").click(function (e) {
            clearInterval(intervalId);
            interval = 200;
            startInterval(interval);
        });

        $("#btnPlay").click(function (e) {
            clearInterval(intervalId);
            interval = 1000;
            startInterval(interval);
        });

    });


})()