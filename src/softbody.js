class Softbody {
    constructor(model, color = "black", ) {
        this.model = model
        this.color = color

        this.welds = []
    }

    static async Load(vertexFile, x, y, scale, springStiffness, color) {
        const softBody = await fetch(`assets/${vertexFile}`).then(res => res.json()).then(data => {
            let vertices = data["vertices"].flat().filter((v, index, self) => 
                index === self.findIndex((s) => ~~s.x === ~~v.x && ~~s.y === ~~v.y) 
            )

            vertices = Vertices.clockwiseSort(vertices).map(vertex => ({
                x: vertex.x * scale,
                y: vertex.y * scale
            }))
    
            const particleBodies = vertices.map(vertex => 
                Bodies.circle(x + vertex.x, y + vertex.y, 1, {
                    label: "node",
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
    
            return new Softbody(Composite.create({
                bodies: particleBodies,
                constraints
            }), color)
        })
    
        return softBody
    }

    Render() {
        const context = render.context

        const vertices = Composite.allBodies(this.model).flatMap(body => body.label == "node" ? body.vertices : [])

        context.save()
        context.beginPath()
        
        context.fillStyle = this.color

        context.moveTo(vertices[0].x, vertices[0].y);

        vertices.forEach(vertex => context.lineTo(vertex.x, vertex.y))

        context.closePath()
        context.fill()
        context.restore()
    }

    AddWeld(offsets) {
        const x = Composite.bounds(this.model).min.x
        const y = Composite.bounds(this.model).min.y
            
        const constraints = []
        const welds = []

        for (const offset of offsets) {
            const weld = Bodies.circle(x + offset[0], y + offset[1], 1, {
                label: "weld",
                mass: 1,
                render: {
                    visible: false
                }
            })
            
            welds.push(weld)

            for (const body of this.model.bodies) {
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
                label: "weldLink",
                bodyA: welds[0],
                bodyB: welds[1],
                stiffness: 1,
                render: {
                    visible: false
                }
            })
        ) 
        
        Composite.add(this.model, [...welds, ...constraints])

        this.welds = welds
    }

    Attach(other, offsetsA, offsetsB) {
        this.AddWeld(offsetsA)
        other.AddWeld(offsetsB)

        for (let i = 0 ; i < 2 ; i++) {
            World.add(engine.world, 
                Constraint.create({
                    bodyA: this.welds[i],
                    bodyB: other.welds[i],
                    stiffness: 0.5,
                    length: 0,
                    render: {
                        visible: false
                    }
                })
            )
        }
    }
}