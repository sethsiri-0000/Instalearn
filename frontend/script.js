const vert = document.getElementById("vertNav");
const p = vert.querySelectorAll("li");
const divs = document.querySelectorAll(".work");
const pointsElement = document.getElementById("points");
const usernameDisplay = document.getElementById("usernameDisplay");
const pointsDisplay = document.getElementById("pointsDisplay");

let xhttp = new XMLHttpRequest();

let form;
let split;
let clone;
let ans;

document.getElementById("name").innerHTML += document.cookie.split('=')[1] + "!";

p.forEach(item => {
    item.addEventListener("click", () => {
        let targetId = item.getAttribute("data-target");
        let target = document.getElementById(targetId);

        divs.forEach(div => {
            div.classList.remove("showin");
        });

        target.classList.add("showin");
    });
});

//LOG OUT
function log() {
    let logout = confirm("Are you sure you want to log out?");
    if (logout == true) {
        document.cookie = "name" + '=; Max-Age=-99999';
        window.location.href = "http://localhost:3000/";
    }
}

//SEND DATA
form = document.getElementById("dumb");
update();

function update() {
    click();
    xhttp = new XMLHttpRequest();

    xhttp.open("POST", "/ups", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    xhttp.onreadystatechange = function () {
        if (xhttp.readyState === 4 && xhttp.status === 200) {
            if (xhttp.responseText === "none") {
                document.getElementById("comp").style.display = "block";
                form.style.display = "none";
            } else if (xhttp.responseText.includes(";")) {
                split = xhttp.responseText.split(";");
                if (split.length >= 8) {
                    document.getElementById("h1").innerHTML = split[0];
                    document.getElementById("op1").innerHTML = split[1];
                    document.getElementById("op2").innerHTML = split[2];
                    document.getElementById("who").innerHTML = "@" + split[3];
                    document.getElementById("extra").innerHTML = split[4];
                    ans = split[5];
        
                    pointsElement.innerText = `Points: ${parseInt(split[6])}`;
                    pointsDisplay.innerText = split[6];
                    usernameDisplay.innerText = split[7];
                } else {
                    console.error("error format:", xhttp.responseText);
                }
            } else {
                console.error("Invalid response:", xhttp.responseText);
            }
        }
        
    }

    xhttp.send("give=true");
}

function ops(x) {
    form.classList.add("finish");
    xhttp = new XMLHttpRequest();

    xhttp.open("POST", "/ups-ans", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    if (ans != "op" + x) {
        document.getElementById("extra").style.color = "red";
        document.getElementById("extra").style.borderColor = "red";
        xhttp.send("ans=false");
    } else {
        document.getElementById("extra").style.color = "green";
        document.getElementById("extra").style.borderColor = "green";
        xhttp.send("ans=true");
    }

    document.getElementById("extra").style.display = "block";
    document.getElementById("extra").style.animation = "some 3s forwards";
}

function click() {
    form.classList.remove("finish");
    document.getElementById("extra").style.display = "none";
}
