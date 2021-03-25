let timer;
let startTime;


const startTimer = (time, callback = undefined) => {
    if (timer) clearInterval(timer);
    startTime = new Date().getTime();

    timer = setInterval(() => {
        if (callback) {
            console.log(new Date().getTime() - startTime)

            if (new Date().getTime() - startTime >= 29000 && new Date().getTime() - startTime < 40000) {

                console.log(new Date().getTime() - startTime)
                callback('turnEnding');
            }

            if (new Date().getTime() - startTime >= 50000 && new Date().getTime() - startTime < 70000) {
                console.log(new Date().getTime() - startTime)
                startTime = new Date().getTime();
                callback('endTurn');

            }
        }
    }, time);
}

const clearTimer = () => {
    if (timer) clearInterval(timer);
}

module.exports = {
    startTimer,
    clearTimer,
}

