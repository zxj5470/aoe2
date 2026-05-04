import { getPlayerColor, getPlayerName } from '../config.js';

class ResourceDisplay {
  constructor(game) {
    this.game = game;
    this.elements = {
      gold: document.getElementById('resource-gold'),
      wood: document.getElementById('resource-wood'),
      food: document.getElementById('resource-food'),
      stone: document.getElementById('resource-stone'),
      populationCurrent: document.getElementById('population-current'),
      populationMax: document.getElementById('population-max'),
      age: document.getElementById('current-age')
    };
    
    this.population = { current: 1, max: 20 };
    this.age = '黑暗时代';
  }

  init() {
    this.updateResourceDisplay();
  }

  updateResourceDisplay() {
    if (!this.game.resourceManager) return;
    
    const resources = this.game.resourceManager.getAllResources();
    
    if (this.elements.gold) {
      this.elements.gold.textContent = resources.gold;
    }
    if (this.elements.wood) {
      this.elements.wood.textContent = resources.wood;
    }
    if (this.elements.food) {
      this.elements.food.textContent = resources.food;
    }
    if (this.elements.stone) {
      this.elements.stone.textContent = resources.stone;
    }
  }

  updatePopulation(current, max) {
    this.population.current = current;
    this.population.max = max;
    
    if (this.elements.populationCurrent) {
      this.elements.populationCurrent.textContent = current;
    }
    if (this.elements.populationMax) {
      this.elements.populationMax.textContent = max;
    }
  }

  updateAge(ageName) {
    this.age = ageName;
    if (this.elements.age) {
      this.elements.age.textContent = ageName;
    }
  }

  getPopulation() {
    return this.population;
  }

  getAge() {
    return this.age;
  }
}

export default ResourceDisplay;
