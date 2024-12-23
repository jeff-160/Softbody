const { Engine, Render, Runner, World, Bodies, Body, Vertices, Constraint, Composite, Events } = Matter;
let engine, render, canvas, context
let wireframes = false

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

        amogus.forEach(part => part.Render())
    })
}

async function CreateAmogus() {
    const body = await Softbody.Load("body.json", window.innerWidth / 2, 0, 1, 0.005, "red")
    const visor = await Softbody.Load("visor.json", window.innerWidth / 2, 0, 0.25, 0.008, "lightblue")

    body.Attach(visor, [[150, 80], [190, 80]], [[30, 40], [70, 40]])
    
    amogus = [body, visor]

    World.add(engine.world, amogus.map(softBody => softBody.model))
}

window.addEventListener("keyup", e => {
    if (e.key === " ") {
        render.options.wireframes = wireframes = !wireframes

        amogus.forEach(part => {
            part.model.constraints.filter(constraint => 
                constraint.label == "outerSpring" || constraint.label =="weldLink"
            ).forEach(constraint => {
                constraint.render.visible = !constraint.render.visible
            })
        })
    }
})
