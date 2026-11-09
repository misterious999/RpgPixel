import { Player } from '../entities/Player.ts';
import { FloatingTextManager } from '../ui/FloatingText.ts';
import { AudioEngine } from '../audio/AudioEngine.ts';
import { ITEM_DEFINITIONS } from '../items/ItemTypes.ts';

export interface CookingRecipe {
  id: string;
  name: string;
  resultItemId: string;
  description: string;
  buffDescription: string;
  ingredients: { itemId: string; count: number }[];
}

export const COOKING_RECIPES: CookingRecipe[] = [
  {
    id: 'WOLF_STEAK_RECIPE',
    name: 'Steak Serigala Rimba Panggang',
    resultItemId: 'WOLF_STEAK',
    description: 'Daging serigala empuk dipanggang dengan rempah hutan beraroma sedap.',
    buffDescription: 'Pulihkan 60 HP & +20% Serangan Fisik (3 menit)',
    ingredients: [{ itemId: 'WOLF_MEAT', count: 1 }]
  },
  {
    id: 'SLIME_PUDDING_RECIPE',
    name: 'Puding Kristal Manis Slime',
    resultItemId: 'SLIME_PUDDING',
    description: 'Puding jeli kenyal menyegarkan yang mengalirkan energi sihir murni.',
    buffDescription: 'Pulihkan 50 MP & Regenerasi Mana Pesat (3 menit)',
    ingredients: [
      { itemId: 'SLIME_JELLY', count: 2 },
      { itemId: 'MAGIC_FLOWER', count: 1 }
    ]
  },
  {
    id: 'MYSTIC_SOUP_RECIPE',
    name: 'Sup Herbal Bunga Mistis',
    resultItemId: 'MYSTIC_SOUP',
    description: 'Sup hangat berkuah hijau harum dengan ekstrak bunga mistis dan kaldu daging.',
    buffDescription: '+25% Kecepatan Gerak & +25% Bonus EXP (3 menit)',
    ingredients: [
      { itemId: 'MAGIC_FLOWER', count: 2 },
      { itemId: 'WOLF_MEAT', count: 1 }
    ]
  }
];

export class CookingSystem {
  public isOpen: boolean = false;
  private container: HTMLDivElement | null = null;
  public onCookSuccess?: (recipe: CookingRecipe) => void;

  constructor() {
    this.createUI();
  }

  private createUI(): void {
    const existing = document.getElementById('cooking-modal-container');
    if (existing) existing.remove();

    this.container = document.createElement('div');
    this.container.id = 'cooking-modal-container';
    this.container.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(3, 7, 18, 0.78);
      backdrop-filter: blur(4px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    document.body.appendChild(this.container);
  }

  public open(player: Player, floatingText: FloatingTextManager): void {
    if (!this.container) return;
    this.isOpen = true;
    this.renderContent(player, floatingText);
    this.container.style.display = 'flex';
  }

  public close(): void {
    if (!this.container) return;
    this.isOpen = false;
    this.container.style.display = 'none';
  }

  private renderContent(player: Player, floatingText: FloatingTextManager): void {
    if (!this.container) return;

    let recipesHtml = '';

    for (const recipe of COOKING_RECIPES) {
      // Check ingredient counts
      let canCraft = true;
      let ingHtml = '';

      for (const ing of recipe.ingredients) {
        const ingDef = ITEM_DEFINITIONS[ing.itemId];
        const owned = player.inventory.getItemCount(ing.itemId);
        const hasEnough = owned >= ing.count;
        if (!hasEnough) canCraft = false;

        ingHtml += `
          <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: ${hasEnough ? '#86efac' : '#f87171'};">
            <span>• ${ingDef?.name || ing.itemId}:</span>
            <span style="font-weight: bold;">${owned} / ${ing.count}</span>
          </div>
        `;
      }

      recipesHtml += `
        <div style="background: rgba(30, 41, 59, 0.85); border: 1px solid rgba(251, 146, 60, 0.35); border-radius: 8px; padding: 12px; margin-bottom: 10px; display: flex; flex-direction: column; gap: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-weight: bold; color: #fdba74; font-size: 14px;">🍳 ${recipe.name}</div>
            <button id="cook-btn-${recipe.id}" ${canCraft ? '' : 'disabled'} style="
              background: ${canCraft ? 'linear-gradient(135deg, #f97316, #ea580c)' : '#475569'};
              color: ${canCraft ? '#ffffff' : '#94a3b8'};
              border: none;
              padding: 6px 14px;
              border-radius: 6px;
              font-weight: bold;
              font-size: 12px;
              cursor: ${canCraft ? 'pointer' : 'not-allowed'};
              box-shadow: ${canCraft ? '0 2px 8px rgba(249, 115, 22, 0.4)' : 'none'};
            ">
              ${canCraft ? '🔥 Masak' : 'Bahan Kurang'}
            </button>
          </div>
          <div style="font-size: 11px; color: #cbd5e1;">${recipe.description}</div>
          <div style="font-size: 11px; color: #38bdf8; font-weight: 500;">✨ Efek Buff: ${recipe.buffDescription}</div>
          <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid rgba(255, 255, 255, 0.08);">
            <div style="font-size: 10px; color: #94a3b8; margin-bottom: 2px;">Bahan Dibutuhkan:</div>
            ${ingHtml}
          </div>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div style="
        background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
        border: 2px solid #ea580c;
        border-radius: 12px;
        width: 90%;
        max-width: 440px;
        max-height: 85vh;
        overflow-y: auto;
        padding: 16px;
        color: #ffffff;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(234, 88, 12, 0.3);
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(234, 88, 12, 0.4); padding-bottom: 8px; margin-bottom: 12px;">
          <div>
            <div style="font-size: 16px; font-weight: 900; color: #fb923c; letter-spacing: 0.5px;">🥘 DAPUR PETUALANG (DUNGEON MESHI)</div>
            <div style="font-size: 11px; color: #94a3b8;">Olah bahan buruan monster menjadi santapan lezat bergizi tinggi!</div>
          </div>
          <button id="close-cooking-btn" style="background: none; border: none; font-size: 20px; color: #94a3b8; cursor: pointer;">✕</button>
        </div>

        <div style="display: flex; flex-direction: column;">
          ${recipesHtml}
        </div>
      </div>
    `;

    // Attach listeners
    const closeBtn = document.getElementById('close-cooking-btn');
    if (closeBtn) closeBtn.onclick = () => this.close();

    for (const recipe of COOKING_RECIPES) {
      const cookBtn = document.getElementById(`cook-btn-${recipe.id}`);
      if (cookBtn) {
        cookBtn.onclick = () => {
          this.cookRecipe(recipe, player, floatingText);
        };
      }
    }
  }

  private cookRecipe(recipe: CookingRecipe, player: Player, floatingText: FloatingTextManager): void {
    // Check again
    for (const ing of recipe.ingredients) {
      if (player.inventory.getItemCount(ing.itemId) < ing.count) {
        floatingText.spawn(player.x + 12, player.y - 12, 'Bahan tidak cukup!', '#ef4444');
        return;
      }
    }

    // Deduct ingredients
    for (const ing of recipe.ingredients) {
      player.inventory.removeItemsById(ing.itemId, ing.count);
    }

    // Add cooked meal
    player.inventory.addItem(recipe.resultItemId, 1);
    AudioEngine.playPotionDrink();
    floatingText.spawn(player.x + 12, player.y - 14, `🍳 +1 ${recipe.name}!`, '#fb923c', 2.2);

    if (this.onCookSuccess) {
      this.onCookSuccess(recipe);
    }

    // Re-render UI to update counts
    this.renderContent(player, floatingText);
  }
}
