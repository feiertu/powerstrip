package {{meta.group}}.networking;

import {{meta.group}}.{{meta.mainClass}};
{{#each hubs.ModNetworking.messages}}import {{meta.group}}.networking.packet.{{beClassName}}C2SPacket;
import {{meta.group}}.networking.packet.{{beClassName}}S2CPacket;
{{/each}}
import net.minecraft.resources.ResourceLocation;
import net.minecraftforge.network.NetworkRegistry;
import net.minecraftforge.network.simple.SimpleChannel;

public class {{networkingCtx.networkClassName}} {
    private static final String PROTOCOL_VERSION = "{{networkingCtx.protocolVersion}}";
    public static final SimpleChannel INSTANCE = NetworkRegistry.ChannelBuilder
            .named(new ResourceLocation({{meta.mainClass}}.MOD_ID, "{{networkingCtx.channelPath}}"))
            .networkProtocolVersion(() -> PROTOCOL_VERSION)
            .clientAcceptedVersions(s -> true)
            .serverAcceptedVersions(s -> true)
            .simpleChannel();

    public static void register() {
        {{#each hubs.ModNetworking.messages}}
        {{#if isC2S}}INSTANCE.registerMessage({{msgId}}, {{beClassName}}C2SPacket.class, {{beClassName}}C2SPacket::encode, {{beClassName}}C2SPacket::decode, {{beClassName}}C2SPacket::handle);
        {{/if}}{{#if isS2C}}INSTANCE.registerMessage({{msgId}}, {{beClassName}}S2CPacket.class, {{beClassName}}S2CPacket::encode, {{beClassName}}S2CPacket::decode, {{beClassName}}S2CPacket::handle);
        {{/if}}{{/each}}
    }
}
