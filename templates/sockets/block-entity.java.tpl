package {{meta.group}}.block.entity.custom;

import {{meta.group}}.block.entity.ModBlockEntities;
import {{meta.group}}.recipe.{{params.recipeClassName}};
import {{meta.group}}.screen.{{params.menuClassName}};
import net.minecraft.core.BlockPos;
import net.minecraft.core.Direction;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.network.chat.Component;
import net.minecraft.network.protocol.Packet;
import net.minecraft.network.protocol.game.ClientGamePacketListener;
import net.minecraft.network.protocol.game.ClientboundBlockEntityDataPacket;
import net.minecraft.world.Containers;
import net.minecraft.world.MenuProvider;
import net.minecraft.world.SimpleContainer;
import net.minecraft.world.entity.player.Inventory;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.inventory.AbstractContainerMenu;
import net.minecraft.world.inventory.ContainerData;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.entity.BlockEntity;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraftforge.common.capabilities.Capability;
import net.minecraftforge.common.capabilities.ForgeCapabilities;
import net.minecraftforge.common.util.LazyOptional;
{{#if capabilities.networking}}import {{meta.group}}.networking.{{capabilities.networking.networkClassName}};
import {{meta.group}}.networking.packet.{{capabilities.networking.beClassName}}S2CPacket;
import net.minecraftforge.network.PacketDistributor;
{{/if}}{{#if capabilities.energy}}import net.minecraftforge.energy.ForgeEnergyStorage;
{{/if}}
import net.minecraftforge.items.IItemHandler;
import net.minecraftforge.items.ItemStackHandler;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

import java.util.Optional;

public class {{params.className}} extends BlockEntity implements MenuProvider {
    private final ItemStackHandler itemHandler = new ItemStackHandler(4) {
        @Override
        protected void onContentsChanged(int slot) {
            setChanged();
            if (!level.isClientSide()) {
                level.sendBlockUpdated(getBlockPos(), getBlockState(), getBlockState(), 3);
            }
        }
    };

    private static final int INPUT_SLOT = 0;
    private static final int FLUID_INPUT_SLOT = 1;
    private static final int ENERGY_ITEM_SLOT = 2;
    private static final int OUTPUT_SLOT = 3;

    private LazyOptional<IItemHandler> lazyItemHandler = LazyOptional.empty();

    {{#if capabilities.energy}}
    private final ForgeEnergyStorage energyStorage = new ForgeEnergyStorage({{capabilities.energy.capacity}}, {{capabilities.energy.maxReceive}}, {{capabilities.energy.maxExtract}}) {
        @Override
        protected void onEnergyChanged() {
            setChanged();
        }
    };
    {{/if}}

    public final ContainerData data;
    private int progress = 0;
    private int maxProgress = {{params.craftTime}};

    public {{params.className}}(BlockPos pPos, BlockState pBlockState) {
        super(ModBlockEntities.{{params.beRegistryField}}.get(), pPos, pBlockState);
        this.data = new ContainerData() {
            @Override
            public int get(int pIndex) {
                return switch (pIndex) {
                    case 0 -> {{params.className}}.this.progress;
                    case 1 -> {{params.className}}.this.maxProgress;
                    default -> 0;
                };
            }

            @Override
            public void set(int pIndex, int pValue) {
                switch (pIndex) {
                    case 0 -> {{params.className}}.this.progress = pValue;
                    case 1 -> {{params.className}}.this.maxProgress = pValue;
                }
            }

            @Override
            public int getCount() {
                return 2;
            }
        };
    }

    @Override
    public @NotNull <T> LazyOptional<T> getCapability(@NotNull Capability<T> cap, @Nullable Direction side) {
        if (cap == ForgeCapabilities.ITEM_HANDLER) {
            return lazyItemHandler.cast();
        }
        {{#if capabilities.energy}}
        if (cap == ForgeCapabilities.ENERGY) {
            return LazyOptional.of(() -> energyStorage).cast();
        }
        {{/if}}

        return super.getCapability(cap, side);
    }

    @Override
    public void onLoad() {
        super.onLoad();
        lazyItemHandler = LazyOptional.of(() -> itemHandler);
    }

    @Override
    public void invalidateCaps() {
        super.invalidateCaps();
        lazyItemHandler.invalidate();
    }

    public void drops() {
        SimpleContainer inventory = new SimpleContainer(itemHandler.getSlots());
        for (int i = 0; i < itemHandler.getSlots(); i++) {
            inventory.setItem(i, itemHandler.getStackInSlot(i));
        }
        Containers.dropContents(this.level, this.worldPosition, inventory);
    }

    @Override
    public Component getDisplayName() {
        return Component.translatable("block.{{meta.modId}}.{{params.blockRegistryPath}}");
    }

    @Nullable
    @Override
    public AbstractContainerMenu createMenu(int pContainerId, Inventory pPlayerInventory, Player pPlayer) {
        return new {{params.menuClassName}}(pContainerId, pPlayerInventory, this, this.data);
    }

    @Override
    protected void saveAdditional(CompoundTag pTag) {
        pTag.put("inventory", itemHandler.serializeNBT());
        pTag.putInt("{{meta.modId}}.{{params.blockRegistryPath}}.progress", progress);

        super.saveAdditional(pTag);
    }

    @Override
    public void load(CompoundTag pTag) {
        super.load(pTag);
        itemHandler.deserializeNBT(pTag.getCompound("inventory"));
        progress = pTag.getInt("{{meta.modId}}.{{params.blockRegistryPath}}.progress");
    }

    public void tick(Level pLevel, BlockPos pPos, BlockState pState) {
        {{#if params.energyConsumes}}if (hasRecipe() && !consumeEnergy()) { resetProgress(); return; }
        {{/if}}if (hasRecipe()) {
            increaseCraftingProgress();
            setChanged();

            if (hasProgressFinished()) {
                craftItem();
                resetProgress();
            }
        } else {
            resetProgress();
        }
    }

    private void resetProgress() {
        progress = 0;
    }

    private boolean hasProgressFinished() {
        return progress >= maxProgress;
    }

    private void increaseCraftingProgress() {
        progress++;
    }

    {{#if params.energyConsumes}}
    private boolean consumeEnergy() {
        if (energyStorage.extractEnergy({{capabilities.energy.consumePerTick}}, true) != {{capabilities.energy.consumePerTick}}) {
            return false;
        }
        energyStorage.extractEnergy({{capabilities.energy.consumePerTick}}, false);
        return true;
    }
    {{/if}}

    private void craftItem() {
        Optional<{{params.recipeClassName}}> recipe = getCurrentRecipe();
        ItemStack result = recipe.get().{{#if features.recipeRegistryAccess}}getResultItem(level.registryAccess()){{else}}getResultItem(){{/if}};

        this.itemHandler.extractItem(INPUT_SLOT, 1, false);
        this.itemHandler.extractItem(FLUID_INPUT_SLOT, 1, false);
        this.itemHandler.extractItem(ENERGY_ITEM_SLOT, 1, false);

        this.itemHandler.setStackInSlot(OUTPUT_SLOT, new ItemStack(result.getItem(),
                this.itemHandler.getStackInSlot(OUTPUT_SLOT).getCount() + result.getCount()));
        {{#if capabilities.networking}}
        if (!level.isClientSide()) {
            {{capabilities.networking.networkClassName}}.INSTANCE.send(PacketDistributor.TRACKING_CHUNK.with(() -> level.getChunkAt(getBlockPos())),
                    new {{capabilities.networking.beClassName}}S2CPacket(getBlockPos()));
        }
        {{/if}}
    }

    private boolean hasRecipe() {
        Optional<{{params.recipeClassName}}> recipe = getCurrentRecipe();

        if (recipe.isEmpty()) {
            return false;
        }
        ItemStack result = recipe.get().{{#if features.recipeRegistryAccess}}getResultItem(level.registryAccess()){{else}}getResultItem(){{/if}};

        return canInsertAmountIntoOutputSlot(result.getCount()) && canInsertItemIntoOutputSlot(result.getItem());
    }

    private Optional<{{params.recipeClassName}}> getCurrentRecipe() {
        SimpleContainer inventory = new SimpleContainer(this.itemHandler.getSlots());
        for (int i = 0; i < itemHandler.getSlots(); i++) {
            inventory.setItem(i, this.itemHandler.getStackInSlot(i));
        }

        return this.level.getRecipeManager().getRecipeFor({{params.recipeClassName}}.Type.INSTANCE, inventory, level);
    }

    private boolean canInsertItemIntoOutputSlot(Item item) {
        return this.itemHandler.getStackInSlot(OUTPUT_SLOT).isEmpty() || this.itemHandler.getStackInSlot(OUTPUT_SLOT).is(item);
    }

    private boolean canInsertAmountIntoOutputSlot(int count) {
        return this.itemHandler.getStackInSlot(OUTPUT_SLOT).getMaxStackSize() >=
                this.itemHandler.getStackInSlot(OUTPUT_SLOT).getCount() + count;
    }

    public ItemStack getRenderStack() {
        return itemHandler.getStackInSlot(INPUT_SLOT);
    }

    {{#if capabilities.networking}}
    public void handlePacketAction(int action) {
        if (action == 0) {
            this.itemHandler.setStackInSlot(OUTPUT_SLOT, ItemStack.EMPTY);
            setChanged();
        }
    }
    {{/if}}

    public ItemStack getRenderStack1() {
        return itemHandler.getStackInSlot(FLUID_INPUT_SLOT);
    }

    public ItemStack getRenderStack2() {
        return itemHandler.getStackInSlot(ENERGY_ITEM_SLOT);
    }

    @Nullable
    @Override
    public Packet<ClientGamePacketListener> getUpdatePacket() {
        return ClientboundBlockEntityDataPacket.create(this);
    }

    @Override
    public CompoundTag getUpdateTag() {
        return saveWithoutMetadata();
    }
}
