let wireframes = false

window.addEventListener("keyup", e => {
    if (e.key === " ") {
        render.options.wireframes = wireframes = !wireframes

        Composite.allComposites(engine.world).forEach(composite => {
            composite.constraints.filter(constraint =>
                constraint.label == "outerSpring" || constraint.label == "weldLink"
            ).forEach(constraint => {
                constraint.render.visible = !constraint.render.visible
            })
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

    await CreateAmogus()
 
    LoadEvents()
}

let amogus = []

function LoadEvents() {
    Events.on(render, "afterRender", () => {
        const context = render.context
        context.font = "20px Arial"
        context.fillStyle = "white"
        context.fillText("Press SPACE to toggle wireframes", 50, 50)

        if (wireframes)
            return

        RenderSoftBody(amogus[0], "red")
        RenderSoftBody(amogus[1], "lightblue")
    })
}

async function CreateAmogus() {
    const body = await LoadSoftBody("body.json", window.innerWidth / 2, 0, 1, 0.005)
    const visor = await LoadSoftBody("visor.json", window.innerWidth / 2, 0, 0.25, 0.008)

    amogus = [body, visor]

    amogus.forEach(part => World.add(engine.world, part))

    const welds1 = AddWeld(body, [[150, 80], [190, 80]])
    const welds2 = AddWeld(visor, [[30, 40], [70, 40]])

    JoinWelds(welds1, welds2)
}