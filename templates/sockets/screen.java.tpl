package {{meta.group}}.screen;

import {{meta.group}}.{{meta.mainClass}};
{{#if capabilities.networking}}import {{meta.group}}.networking.{{capabilities.networking.networkClassName}};
import {{meta.group}}.networking.packet.{{capabilities.networking.beClassName}}C2SPacket;
{{/if}}
import com.mojang.blaze3d.systems.RenderSystem;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.gui.screens.inventory.AbstractContainerScreen;
import net.minecraft.client.renderer.GameRenderer;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.entity.player.Inventory;

public class {{params.screenClassName}} extends AbstractContainerScreen<{{params.menuClassName}}> {
    private static final ResourceLocation TEXTURE =
            new ResourceLocation({{meta.mainClass}}.MOD_ID, "textures/gui/{{params.guiTexturePath}}.png");

    public {{params.screenClassName}}({{params.menuClassName}} pMenu, Inventory pPlayerInventory, Component pTitle) {
        super(pMenu, pPlayerInventory, pTitle);
    }

    @Override
    protected void init() {
        super.init();
        this.inventoryLabelY = 10000;
        this.titleLabelY = 10000;
    }

    @Override
    protected void renderBg(GuiGraphics pGuiGraphics, float pPartialTick, int pMouseX, int pMouseY) {
        RenderSystem.setShader(GameRenderer::getPositionTexShader);
        RenderSystem.setShaderColor(1.0F, 1.0F, 1.0F, 1.0F);
        RenderSystem.setShaderTexture(0, TEXTURE);
        int x = (width - imageWidth) / 2;
        int y = (height - imageHeight) / 2;

        pGuiGraphics.blit(TEXTURE, x, y, 0, 0, imageWidth, imageHeight);

        renderProgressArrow(pGuiGraphics, x, y);
        {{#if capabilities.networking}}
        pGuiGraphics.fill(x + 95, y + 55, x + 135, y + 70, 0xFF555555);
        pGuiGraphics.drawString(this.font, "Clear", x + 98, y + 58, 0xFFFFFF);
        {{/if}}
    }

    private void renderProgressArrow(GuiGraphics guiGraphics, int x, int y) {
        if (menu.isCrafting()) {
            guiGraphics.blit(TEXTURE, x + 85, y + 30, 176, 0, 8, menu.getScaledProgress());
        }
    }

    @Override
    public void render(GuiGraphics guiGraphics, int mouseX, int mouseY, float delta) {
        {{#if features.screenBgWithMouse}}renderBackground(guiGraphics, mouseX, mouseY, delta);{{else}}renderBackground(guiGraphics);{{/if}}
        super.render(guiGraphics, mouseX, mouseY, delta);
        renderTooltip(guiGraphics, mouseX, mouseY);
    }

    {{#if capabilities.networking}}
    @Override
    public boolean mouseClicked(double pMouseX, double pMouseY, int pButton) {
        if (isClearButton(pMouseX, pMouseY)) {
            {{capabilities.networking.networkClassName}}.INSTANCE.sendToServer(new {{capabilities.networking.beClassName}}C2SPacket(menu.getBlockEntity().getBlockPos(), 0));
            return true;
        }
        return super.mouseClicked(pMouseX, pMouseY, pButton);
    }

    private boolean isClearButton(double mouseX, double mouseY) {
        int x = (width - imageWidth) / 2;
        int y = (height - imageHeight) / 2;
        return mouseX >= x + 95 && mouseX <= x + 135 && mouseY >= y + 55 && mouseY <= y + 70;
    }
    {{/if}}
}
