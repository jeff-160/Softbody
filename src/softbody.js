async function LoadSoftBody(vertexFile, x, y, scale, springStiffness) {
    const softBody = await fetch(`assets/${vertexFile}`).then(res => res.json()).then(data => {
        let vertices = data["vertices"].flat().filter( 
            (v, index, self) => 
                index === self.findIndex((s) => ~~s.x === ~~v.x && ~~s.y === ~~v.y) 
        )
        vertices = Vertices.clockwiseSort(vertices)

        vertices = vertices.map(vertex => ({
            x: vertex.x * scale,
            y: vertex.y * scale
        }))

        const particleBodies = vertices.map(vertex => 
            Bodies.circle(x + vertex.x, y + vertex.y, 1, {
                mass: 1,
                render: {
                    visible: false
                }
            })
        )

        const constraints = []

        for (let i = 0 ; i < vertices.length ; i++) {
            const next = (i + 1) % vertices.length

            constraints.push(
                Constraint.create({
                    label: "outerSpring",
                    bodyA: particleBodies[i],
                    bodyB: particleBodies[next],
                    stiffness: springStiffness,
                    isStatic: true,
                    render: {
                        visible: false
                    }
                })
            )
        }

        for (let i = 0; i < vertices.length; i++) {
            for (let j = i + 2; j < vertices.length; j++) { 
                if (Math.abs(i - j) !== vertices.length - 1) {
                    constraints.push(
                        Constraint.create({
                            label: "innerSpring",
                            bodyA: particleBodies[i],
                            bodyB: particleBodies[j],
                            stiffness: springStiffness,
                            render: {
                                visible: false
                            }
                        })
                    );
                }
            }
        }

        const softBody = Composite.create({
            bodies: particleBodies,
            constraints
        })

        return softBody
    })

    return softBody
}

function RenderSoftBody(softBody, color) {
    const context = render.context

    const vertices = Composite.allBodies(softBody).flatMap(body => body.vertices)

    context.save()
    context.beginPath()
    
    context.fillStyle = color

    context.moveTo(vertices[0].x, vertices[0].y);

    vertices.forEach(vertex => context.lineTo(vertex.x, vertex.y))

    context.closePath()
    context.fill()
    context.restore()
}

function AddWeld(composite, offsets) {
    const x = Composite.bounds(composite).min.x
    const y = Composite.bounds(composite).min.y
        
    const constraints = []
    const welds = []

    for (const offset of offsets) {
        const weld = Bodies.circle(x + offset[0], y + offset[1], 1, { 
            mass: 1,
            render: {
                visible: false
            }
        })
        
        welds.push(weld)
        
        for (const body of composite.bodies) {
            constraints.push(
                Constraint.create({
                    label: "weldSpring",
                    bodyA: body,
                    bodyB: weld,
                    stiffness: 0.5,
                    render: {
                        visible: false
                    }
                })
            )
        }
    }

    constraints.push(
        Constraint.create({
            label: "weldConnection",
            bodyA: welds[0],
            bodyB: welds[1],
            stiffness: 1,
            render: {
                visible: false
            }
        })
    )

    World.add(engine.world, [...welds, ...constraints])

    return welds
}

function JoinWelds(weld1, weld2, stiffness) {
    for (let i = 0 ; i < 2 ; i++) {
        Body.setPosition(weld2[i], weld1[i].position)

        World.add(engine.world, 
            Constraint.create({
                bodyA: weld1[i],
                bodyB: weld2[i],
                stiffness: stiffness,
                length: 0,
                render: {
                    visible: false
                }
            })
        )
    }
}