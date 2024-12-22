let wireframes = false

window.addEventListener("keyup", e => {
    if (e.key === " ") {
        wireframes = !wireframes

        Composite.allComposites(engine.world).forEach(composite => {
            composite.constraints.filter(constraint =>
                constraint.label == "outerSpring"
            ).forEach(constraint => {
                constraint.render.visible = !constraint.render.visible
            })
        })

        engine.world.constraints.filter(constraint => 
            constraint.label == "weldConnection"
        ).forEach(constraint => {
            constraint.render.visible = !constraint.render.visible
        })
    }
})

const { Engine, Render, Runner, World, Bodies, Body, Vertices, Constraint, Composite, Events } = Matter;
let engine, render, canvas, context

window.onload = async () => {
    engine = Engine.create()

    render = Render.create({
        element: document.body,
        engine: engine,
        options: {
            width: 1280,
            height: 593,
            wireframes: false,
        }
    })

    Render.run(render)

    canvas = render.canvas

    Runner.run(Runner.create(), engine)

    const ground = Bodies.rectangle(0, 0, window.innerWidth, 100, { 
        isStatic: true,
        render: {
            fillStyle: "grey"
        }
    })

    Body.setPosition(ground, {
        x: window.innerWidth / 2,
        y: window.innerHeight - GetSize(ground, "height") / 2
    })

    World.add(engine.world, ground)

    CreateAmogus()
    
    LoadEvents()
}

let bodies = []

function LoadEvents() {
    Events.on(render, "afterRender", () => {
        const context = render.context
        context.font = "20px Arial"
        context.fillStyle = "white"
        context.fillText("Press SPACE to toggle wireframes", 50, 50)

        if (wireframes)
            return

        bodies.forEach(body => {
            RenderSoftBody(...body)
        })
    })
}

async function CreateAmogus() {
    const bodyScale = 1
    const visorScale = 0.25

    const body = await LoadSoftBody("body.json", window.innerWidth / 2, -100, bodyScale, 0.005)
    const visor = await LoadSoftBody("visor.json", window.innerWidth / 2, -100, visorScale, 0.008)

    bodies = [
        [body, "red"],
        [visor, "lightblue"]
    ]

    bodies.forEach(part => World.add(engine.world, part))

    const welds1 = AddWeld(body, [[140, 80], [180, 80]], bodyScale)
    const welds2 = AddWeld(visor, [[30, 40], [70, 40]], visorScale)

    JoinWelds(welds1, welds2, 0.8)

    // all parts must be rotated
    bodies.forEach(body => {
        Composite.rotate(body[0], Math.PI / 3, {
            x: Composite.bounds(body[0]).min.x,
            y: Composite.bounds(body[0]).min.y
        })
    })
}