import { describe, it, expect } from 'vitest';
import { animalStats } from '@/lib/animal-stats';

describe('Animal Stats Integrity', () => {
  it('should have valid stats for all animals', () => {
    Object.entries(animalStats).forEach(([name, stats]) => {
      expect(stats.attack_power, `Invalid attack_power for ${name}`).toBeGreaterThan(0);
      expect(stats.strength, `Invalid strength for ${name}`).toBeGreaterThan(0);
      expect(stats.speed, `Invalid speed for ${name}`).toBeGreaterThan(0);
      expect(stats.energy, `Invalid energy for ${name}`).toBeGreaterThan(0);
    });
  });

  it('should have mythical creatures with high stats', () => {
    const dragon = animalStats['Dragon'];
    expect(dragon.attack_power).toBe(100);
    expect(dragon.strength).toBe(100);
  });

  it('should have correct number of animals', () => {
    const totalAnimals = Object.keys(animalStats).length;
    expect(totalAnimals).toBeGreaterThan(50);
  });
});
