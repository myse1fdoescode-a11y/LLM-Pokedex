// ? Data
let searchForm = document.querySelector("form")
searchForm.addEventListener("submit", (event) => {
    event.preventDefault()
    const searchQuery = document.getElementById('search-query').value.toLowerCase()
    
    let main = document.querySelector('main')
    main.replaceChildren()
    getPokemon(searchQuery)
        .then(pokemon => renderPokemon(pokemon))
        .catch(error => {
            let errorText = document.createElement('h3')
            errorText.classList.add('error')
            errorText.textContent = error
            main.appendChild(errorText)
        })
        
})

async function getPokemon(query) {
    query = query.trim().toLowerCase()
    const url = `https://pokeapi.co/api/v2/pokemon/${query}`
    try {
        let pokeData = (await fetch(url))
        if (pokeData.status === 404){
            throw new Error('Endpoint does not exist')
        } else if (!pokeData.ok) {
            throw new Error('Unable to fetch')
        } 
        
        pokeData = await pokeData.json()
        return pokeData
    } 
    catch(err) {
        /* 
            ? in the future this would display on the page and tell the user that 
            ? server didn't return anything
        */
        console.log(err)
    }
}

// ? Ui
function renderPokemon(pokemon) {
    let card = document.createElement('div')
    card.classList.add('pokedex-card')

    let cardHead = document.createElement('div')
    cardHead.classList.add('card-head')
        let pokemonName = document.createElement('h3')
        pokemonName.classList.add('pokemon-name')
        pokemonName.textContent = pokemon.name
        let pokemonNumber = document.createElement('h3')
        pokemonNumber.classList.add("pokemon-number")
        pokemonNumber.textContent = pokemon.id
        let typeContainer = document.createElement("div")
        typeContainer.classList.add('type-container')
        pokemon.types.forEach(typeObj => {
            let typeWrapper = document.createElement('span')
            let typeName = typeObj.type.name
            typeWrapper.textContent = typeName
            typeWrapper.classList.add('type',`${typeName}`)
            typeContainer.appendChild(typeWrapper)
        })
        cardHead.append(pokemonName,pokemonNumber,typeContainer)
    card.appendChild(cardHead)

        let cardTop = document.createElement('div')
        cardTop.classList.add('card-top')
            let spriteImageWrapper = document.createElement('figure')
            spriteImageWrapper.classList.add('card-img-top')
                let cardImage = document.createElement("img")
                cardImage.src = pokemon.sprites.front_default
                cardImage.alt = `Front facing ${pokemon.name}`
                spriteImageWrapper.appendChild(cardImage)
            cardTop.appendChild(spriteImageWrapper)
        
            let topInfoContainer = document.createElement("div")
            topInfoContainer.classList.add('card-info-top')
                
                let metricContainer = document.createElement('div')
                metricContainer.classList.add('metric-container')
                    let metricHeader = document.createElement("h4")
                    metricHeader.textContent = "Metrics:"
                    let pokemonHeight = document.createElement('p')
                    pokemonHeight.classList.add('pokemon-height')
                    pokemonHeight.textContent = pokemon.height
                    let pokemonWeight = document.createElement('p')
                    pokemonWeight.classList.add('pokemon-weight')
                    pokemonWeight.textContent = pokemon.weight
                metricContainer.append(metricHeader,pokemonHeight,pokemonWeight)
                
                let abilitiesContainer = document.createElement('div')
                abilitiesContainer.classList.add('ability-container')
                    let abilitiesHeader = document.createElement("h4")
                    abilitiesHeader.textContent = "Abilities:"
                    let abilitiesList = document.createElement('ul')
                        pokemon.abilities.forEach(abilityObj => {
                            let abilityElmnt = document.createElement('li')
                            abilityElmnt.textContent = abilityObj.ability.name
                            abilitiesList.appendChild(abilityElmnt)
                            
                        });
                abilitiesContainer.append(abilitiesHeader,abilitiesList)
            topInfoContainer.append(metricContainer,abilitiesContainer)
        cardTop.append(topInfoContainer)
    card.appendChild(cardTop)
    let statsContainer = document.createElement('div')
    statsContainer.classList.add('pokemon-stats')
        let statListContainer1 = document.createElement('div')
            statListContainer1.classList.add('stat-list')
        let statListContainer2 = document.createElement('div')
            statListContainer2.classList.add('stat-list')
            pokemon.stats.forEach((statObj,index) => {
                    
                let singleStatContainer = document.createElement('div')
                singleStatContainer.classList.add('stat-container')
                    let statName = document.createElement('p')
                    statName.classList.add('stat-name')
                    statName.textContent = statObj.stat.name
                    // ? Considering making this a percent representing bar
                    let statValue = document.createElement('p')
                    statValue.classList.add('stat-value')
                    statValue.textContent = statObj.base_stat
                    singleStatContainer.append(statName,statValue)
                if (index < 3){
                    statListContainer1.appendChild(singleStatContainer)
                    return
                }
                statListContainer2.appendChild(singleStatContainer)
            })
        statsContainer.append(statListContainer1,statListContainer2)
        card.append(statsContainer)

    const main = document.querySelector('main')
    main.appendChild(card)

}
