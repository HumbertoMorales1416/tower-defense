const canvas = document.querySelector('canvas')
const context = canvas.getContext('2d')
const image = new Image()
const placementTilesData2D = []
const placementTiles = []
const enemies = []
const buildings = []
const mouse = { x: undefined, y: undefined }
const explosions = []
let activeTile = undefined
let enemyCount = 3
let hearts = 10
let coins = 100

canvas.width = 1280
canvas.height = 768

context.fillStyle = 'white'
context.fillRect(0, 0, canvas.width, canvas.height)

image.onload = () => {
    animate();
}
image.src = 'img/gameMap.png'

for (let i = 0; i < placementTilesData.length; i += 20) {
    placementTilesData2D.push(placementTilesData.slice(i, i + 20))
}

placementTilesData2D.forEach((row, y) => {
    row.forEach((symbol, x) => {
        if (symbol === 14) {
            placementTiles.push(
                new PlacementTile({
                    position: { x: x * 64, y: y * 64 }
                })
            )
        }
    })
})

function spawnEnemies(spawnCount) {
    for (let i = 1; i < spawnCount + 1; i++) {
        const xOffset = i * 150
        enemies.push(
            new Enemy({
                position: { x: waypoints[0].x - xOffset, y: waypoints[0].y }
            })
        )
    }
}

spawnEnemies(enemyCount)

function animate() {
    const animationId = requestAnimationFrame(animate);

    context.drawImage(image, 0, 0);

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i]
        enemy.update()
        //Valida cuando el enemigo pase por la ruta final
        if (enemy.position.x > canvas.width) {
            hearts -= 1
            enemies.splice(i, 1)
            document.querySelector("#hearts").innerHTML = hearts
            //Cuando se agote la vida se cancele la animacion y muestre el div de game over
            if (hearts === 0) {
                cancelAnimationFrame(animationId)
                document.querySelector('#game-over').style.display = 'flex'
            }
        }
    }

    //Se muestran las explosiones
    for (let i = explosions.length - 1; i >= 0; i--) {
        const explosion = explosions[i]
        explosion.draw()
        explosion.update()

        if (explosion.frames.current >= explosion.frames.max - 1) {
            explosions.splice(i, 1)
        }
    }

    //Cuando ya no hay enemigos incrementa en 2 la nueva aparicion
    if (enemies.length === 0) {
        enemyCount += 2
        spawnEnemies(enemyCount)
    }

    //Si muestran los lugares disponibles para las torres
    placementTiles.forEach(tile => {
        tile.update(mouse)
    })

    //Se muestran las torres
    buildings.forEach((building) => {
        building.update()
        building.target = null
        const validEnemies = enemies.filter(enemy => {
            const xDifference = enemy.center.x - building.center.x
            const yDifference = enemy.center.y - building.center.y
            const distance = Math.hypot(xDifference, yDifference)
            return distance < enemy.radius + building.radius
        })
        building.target = validEnemies[0]

        for (let i = building.projectiles.length - 1; i >= 0; i--) {
            const projectile = building.projectiles[i]

            projectile.update()

            const xDifference = projectile.enemy.center.x - projectile.position.x
            const yDifference = projectile.enemy.center.y - projectile.position.y
            const distance = Math.hypot(xDifference, yDifference)

            // Cuando el proyectil impacta a un enemigo
            if (distance < projectile.enemy.radius + projectile.radius) {
                // Se reduce la salud y se elimina el proyectil
                projectile.enemy.health -= 20
                if (projectile.enemy.health <= 0) {
                    const enemyIndex = enemies.findIndex((enemy) => {
                        return projectile.enemy === enemy
                    })
                    if (enemyIndex > -1) {
                        enemies.splice(enemyIndex, 1)
                        coins += 25
                        document.querySelector("#coins").innerHTML = coins
                    }
                }
                //Se agrega la posicion donde desaparece el proyectil para animar la explosion
                explosions.push(new Sprite({
                    position: { 
                        x: projectile.position.x, 
                        y: projectile.position.y 
                    },
                    imageSrc: './img/explosion.png',
                    frames: { 
                        max: 4
                    },
                    offset: { 
                        x: 0, 
                        y: 0 
                    }
                }))
                //Se elimina el proyectil
                building.projectiles.splice(i, 1)
            }
        }
    })
}

canvas.addEventListener('click', (event) => {
    if (activeTile && !activeTile.isOccupied && coins - 50 >= 0) {
        coins -= 50
        document.querySelector("#coins").innerHTML = coins
        buildings.push(
            new Building({
                position: {
                    x: activeTile.position.x,
                    y: activeTile.position.y
                }
            })
        )
        activeTile.isOccupied = true
        buildings.sort((a, b) => {
            return a.position.y - b.position.y
        })
    }
})

window.addEventListener('mousemove', (event) => {
    mouse.x = event.clientX
    mouse.y = event.clientY

    activeTile = null
    for (let i = 0; i < placementTiles.length; i++) {
        const tile = placementTiles[i]
        if (
            mouse.x > tile.position.x &&
            mouse.x < tile.position.x + tile.size &&
            mouse.y > tile.position.y &&
            mouse.y < tile.position.y + tile.size
        ) {
            activeTile = tile
            break
        }
    }
})