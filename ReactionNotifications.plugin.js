/**
 * @name ReactionNotifications
 * @invite undefined
 * @authorLink undefined
 * @donate undefined
 * @patreon undefined
 * @website https://github.com/DaBLEshOT/ReactionNotifications
 * @source https://raw.githubusercontent.com/DaBLEshOT/ReactionNotifications/main/ReactionNotifications.plugin.js
 * @updateUrl https://raw.githubusercontent.com/DaBLEshOT/ReactionNotifications/main/ReactionNotifications.plugin.js
 */
/*@cc_on
@if (@_jscript)
	
	// Offer to self-install for clueless users that try to run this directly.
	var shell = WScript.CreateObject("WScript.Shell");
	var fs = new ActiveXObject("Scripting.FileSystemObject");
	var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\BetterDiscord\plugins");
	var pathSelf = WScript.ScriptFullName;
	// Put the user at ease by addressing them in the first person
	shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
	if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
		shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
	} else if (!fs.FolderExists(pathPlugins)) {
		shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
	} else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
		fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
		// Show the user where to put plugins in the future
		shell.Exec("explorer " + pathPlugins);
		shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
	}
	WScript.Quit();

@else@*/

module.exports = (() => {
    const config = {"info":{"name":"ReactionNotifications","authors":[{"name":"DaBLEshOT","discord_id":"145880086157983744","github_username":"DaBLEshOT"}],"version":"0.0.3","description":"Add notifications for reactions","github":"https://github.com/DaBLEshOT/ReactionNotifications","github_raw":"https://raw.githubusercontent.com/DaBLEshOT/ReactionNotifications/main/ReactionNotifications.plugin.js"},"changelog":[{"title":"Changes","items":["Changed the way how reaction updates are checked. Should be more lightweight."]}],"main":"index.js"};

    return !global.ZeresPluginLibrary ? class {
        constructor() {this._config = config;}
        getName() {return config.info.name;}
        getAuthor() {return config.info.authors.map(a => a.name).join(", ");}
        getDescription() {return config.info.description;}
        getVersion() {return config.info.version;}
        load() {
            BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
                confirmText: "Download Now",
                cancelText: "Cancel",
                onConfirm: () => {
                    require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                    });
                }
            });
        }
        start() {}
        stop() {}
    } : (([Plugin, Api]) => {
        const plugin = (Plugin, Library) => {
    const css = `.ReactionNotification-container {
    pointer-events: auto;
    cursor: pointer;
    line-height: normal;
}

.ReactionNotification-secondary {
    text-align: center;
    color: #636363;
    font-size: 10px;
}`;
    const { remote } = require("electron");

    const { PluginUtilities, Toasts, WebpackModules, DiscordModules } = Library;
    const {
        Dispatcher,
        DiscordConstants: { ActionTypes },
        NavigationUtils,
        SoundModule,
        ChannelStore,
        MessageStore,
        UserStore,
        SelectedChannelStore
    } = DiscordModules;

    return class ReactionNotifications extends Plugin {
        constructor() {
            super();

            this.currentUser = UserStore.getCurrentUser();
            this.isMuted = WebpackModules.getByProps("isGuildOrCategoryOrChannelMuted").isGuildOrCategoryOrChannelMuted.bind(WebpackModules.getByProps("isGuildOrCategoryOrChannelMuted"));
        }

        onStart() {
            PluginUtilities.addStyle(this.getName(), css);
            Dispatcher.subscribe(ActionTypes.MESSAGE_REACTION_ADD, this.showNotification.bind(this));
        }

        onStop() {
            PluginUtilities.removeStyle(this.getName());
            Dispatcher.unsubscribe(ActionTypes.MESSAGE_REACTION_ADD, this.showNotification);
        }

        showNotification(reaction) {
            const channel = ChannelStore.getChannel(reaction.channelId);
            const message = MessageStore.getMessage(reaction.channelId, reaction.messageId);

            if (!this.isMuted(channel.guild_id, channel.id) && message.author.id == this.currentUser.id && reaction.userId != this.currentUser.id) {
                
                if (!remote.getCurrentWindow().isFocused()) {
                    this.showDesktopNotification(channel, reaction);
                } else if (SelectedChannelStore.getChannelId() != message.channel_id) {
                    this.showToastNotification(channel, reaction);
                }

                SoundModule.playSound("message1", 0.4);
            }
        }

        showDesktopNotification(channel, reaction) {
            const reactionUser = UserStore.getUser(reaction.userId);

            const notification = new Notification(
                `${reactionUser.username} reacted with ${reaction.emoji.name}`,
                {
                    body: "Click to see the message",
                    silent: true,
                    icon: this.getAvatar(reactionUser.id, reactionUser.avatar)
                }
            );

            notification.addEventListener("click", () => {
                this.goToMessage(channel.guild_id, channel.id, reaction.messageId);
            });
        }

        showToastNotification(channel, reaction) {
            const reactionUser = UserStore.getUser(reaction.userId);

            const content = `<div class="ReactionNotification-container">
                                <div><b>${reactionUser.username}</b> reacted with ${reaction.emoji.name}</div>
                                <div class="ReactionNotification-secondary">Click to see the message</div>
                            </div>`;

            Toasts.default(content, { timeout: 5000 });

            const toast = document.querySelector(".ReactionNotification-container");
            toast.addEventListener("click", () => {
                this.goToMessage(channel.guild_id, channel.id, reaction.messageId);

                toast.parentElement.parentElement.classList.add("closing");
            });
        }

        goToMessage(server, channel, message) {
            remote.getCurrentWindow().focus();

            NavigationUtils.transitionTo(`/channels/${server ? server : '@me'}/${channel}/${message}`);
            requestAnimationFrame(() => NavigationUtils.transitionTo(`/channels/${server ? server : '@me'}/${channel}/${message}`));
        }

        getAvatar(userID, avatarID) {
            return `https://cdn.discordapp.com/avatars/${userID}/${avatarID}.png?size=128`
        }
    };
};
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/