<script>
    export let closing;
</script>

<style>
    .container {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .circle {
        position: relative;
        width: 150vh;
        height: 70vh;
        filter: url(#wavy) blur(1px);
        background-image: url("../images/nethergrasp.jpg");
        background-size: cover;
        background-repeat: no-repeat;
        background-position: center center;
        border-radius: 20%;
        z-index: 10;
    }
    .circle:before {
        content: "";
        position: absolute;
        top: 0px;
        left: 0px;
        right: 0px;
        bottom: 0px;
        border: 20px solid #fff;
        border-radius: 20%;
        box-shadow: 0 0 30px #0f0, inset 0 0 30px #0f0;
        -webkit-box-reflect: below 10px
            linear-gradient(transparent, transparent, #0002);
        animation: animate 5s linear infinite;
    }
    .circle:after {
        content: "";
        position: absolute;
        top: 0px;
        left: 0px;
        right: 0px;
        bottom: 0px;
        border: 20px solid #fff;
        border-radius: 20%;
        box-shadow: 0 0 10px #fff, inset 0 0 20px #fff;
        /* -webkit-box-reflect: below 10px
            linear-gradient(transparent, transparent, #0002);
        animation: animate 5s linear infinite; */
    }

    @keyframes animate {
        0% {
            box-shadow: 0 0 30px #0f0, inset 0 0 30px #0f0;
            filter: hue-rotate(0deg);
        }
        20% {
            box-shadow: 0 0 30px #0f0, inset 0 0 30px #0f0;
        }
        40% {
            box-shadow: 0 0 30px #0f0, inset 0 0 30px #0f0;
        }
        60% {
            box-shadow: 0 0 30px #0f0, inset 0 0 30px #0f0;
        }
        80% {
            box-shadow: 0 0 30px #0f0, inset 0 0 30px #0f0;
        }
        100% {
            box-shadow: 0 0 50px #0f0, inset 0 0 50px #0f0;
            filter: hue-rotate(360deg);
        }
    }

    svg {
        width: 0;
        height: 0;
    }

    .circle {
        -webkit-animation: fadein 2s; /* Safari, Chrome and Opera > 12.1 */
        -moz-animation: fadein 2s; /* Firefox < 16 */
        -ms-animation: fadein 2s; /* Internet Explorer */
        -o-animation: fadein 2s; /* Opera < 12.1 */
        animation: fadein 2s;
    }
    .circle.closing {
        -webkit-animation: fadeout 2s; /* Safari, Chrome and Opera > 12.1 */
        -moz-animation: fadeout 2s; /* Firefox < 16 */
        -ms-animation: fadeout 2s; /* Internet Explorer */
        -o-animation: fadeout 2s; /* Opera < 12.1 */
        animation: fadeout 2s;
    }

    .contentContainer {
        -webkit-animation: fadein 2s; /* Safari, Chrome and Opera > 12.1 */
        -moz-animation: fadein 2s; /* Firefox < 16 */
        -ms-animation: fadein 2s; /* Internet Explorer */
        -o-animation: fadein 2s; /* Opera < 12.1 */
        animation: fadein 2s;
        z-index: 100;
    }

    @keyframes fadein {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    @keyframes fadeout {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }

    /* Firefox < 16 */
    @-moz-keyframes fadein {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    @-moz-keyframes fadeout {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }

    /* Safari, Chrome and Opera > 12.1 */
    @-webkit-keyframes fadein {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    @-webkit-keyframes fadeout {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }

    /* Internet Explorer */
    @-ms-keyframes fadein {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    @-ms-keyframes fadeout {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }

    /* Opera < 12.1 */
    @-o-keyframes fadein {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    @-o-keyframes fadeout {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
</style>

<div class="container {closing ? 'closing' : ''}">
    <div class="circle {closing ? 'closing' : ''}" />
    <svg>
        <filter id="wavy">
            <feTurbulence
                x="0"
                y="0"
                baseFrequency="0.009"
                numOctaves="5"
                seed="2">
                <animate
                    attributeName="baseFrequency"
                    dur="60s"
                    values="0.02;0.005;0.02"
                    repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale="30" />
        </filter>
    </svg>
</div>
