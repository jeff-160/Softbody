function GetSize(body, attr) {
    const prop = attr == "width" ? "x" : "y"
    
    return body.bounds.max[prop] - body.bounds.min[prop]
}

function ScaleTexture(rect) {
    const image = new Image()
    image.src = rect.render.sprite.texture

    image.onload = ()=> {
        rect.render.sprite.xScale = GetSize(rect, "width") / image.width
        rect.render.sprite.yScale = GetSize(rect, "height") / image.height
    }
}

async function LoadSprite(imageFile, vertexFile, x, y, scale, options = {}) {
    const sprite = await fetch(`assets/${vertexFile}`).then(res => res.json()).then(
        data => {
            const vertices = data["vertices"].flat().filter( 
                    (v, index, self) => 
                        index === self.findIndex((s) => ~~s.x === ~~v.x && ~~s.y === ~~v.y) 
                );
        
            const body = Bodies.fromVertices(x, y, [Vertices.clockwiseSort(vertices)], {
                ...options,
                render: {
                    sprite: {
                        texture: `assets/${imageFile}`,
                        single: true,
                        xScale: scale,
                        yScale: scale
                    }
                }
            }, true)

            Body.scale(body, scale, scale)

            return body
        }
    )

    return sprite
}