package {{meta.group}}.util;

import {{meta.group}}.{{meta.mainClass}};
import net.minecraft.world.level.block.state.properties.BlockSetType;
import net.minecraft.world.level.block.state.properties.WoodType;

public class ModWoodTypes {
    {{#each hubs.ModWoodTypes.entries}}
    public static final WoodType {{regField}} = WoodType.register(new WoodType({{meta.mainClass}}.MOD_ID + ":{{woodName}}", BlockSetType.OAK));
    {{/each}}
}
