(function () {
    const currentTimer = document.getElementById("currentTime")
    const svgContainer_style = getComputedStyle(svgContainer);
    let windowWidth = parseInt(svgContainer_style.getPropertyValue('width'));
    let windowHeight = window.innerHeight;

    d3Scripts.init(windowWidth, windowHeight);

    setInterval(() => {
        var d = new Date();
        currentTimer.innerHTML = d.toLocaleTimeString();
    }, 1000);


    $("#btnSwitchView").click(function (e) {
        d3Scripts.switchViewStyle();
    });


})()