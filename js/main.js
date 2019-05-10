(function () {
    $(document).ready(function () {
        const currentTimer = document.getElementById("currentTime")
        const svgContainer_style = getComputedStyle(svgContainer);
        let windowWidth = parseInt(svgContainer_style.getPropertyValue('width'));
        let windowHeight = window.innerHeight;
        let d = new Date();

        d3Scripts.setDate(d.getDay(), d.getHours(), d.getMinutes());
        d3Scripts.init(windowWidth, windowHeight);

        setInterval(() => {
            d = new Date();
            currentTimer.innerHTML = d.toLocaleTimeString();
            d3Scripts.setDate(d.getDay(), d.getHours(), d.getMinutes())
        }, 1000);


        $("#btnSwitchView").click(function (e) {
            d3Scripts.switchViewStyle();
        });

    });


})()