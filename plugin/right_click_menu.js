(() => {
    const config = {
        LOOP_DETECT_INTERVAL: 200
    }

    const getPlugins = () => {
        const enable = global._plugins.filter(plugin => plugin.enable === true);
        const clickable = enable.filter(plugin => plugin.clickable === true);
        const nonClickable = enable.filter(plugin => plugin.clickable === false);
        return {clickable, nonClickable, enable}
    }

    const appendFirst = () => {
        const ul = document.querySelector(`#context-menu`);
        const line = document.createElement("li");
        line.classList.add("divider");
        line.setAttribute("data-group", "plugin");
        ul.appendChild(line);

        const li = `
            <li data-key="typora-plugin" data-group="enable-plugin" class="has-extra-menu">
                <a role="menuitem">
                    <span data-localize="启用插件" data-lg="Menu">启用插件</span>
                    <i class="fa fa-caret-right"></i>
                </a>
            </li>`
        ul.insertAdjacentHTML('beforeend', li);
    }

    const appendSecond = (clickablePlugins, nonClickablePlugins) => {
        const clickable = clickablePlugins.map(plugin => createSecondLi(plugin)).join("");
        const nonClickable = nonClickablePlugins.map(plugin => createSecondLi(plugin)).join("");
        const divider = `<li class="divider"></li>`
        const secondUl = createUl();
        secondUl.id = "plugin-menu";
        secondUl.innerHTML = clickable + divider + nonClickable;
        document.querySelector("content").appendChild(secondUl);
    }

    const appendThird = enablePlugins => {
        enablePlugins.forEach(plugin => {
            if (!plugin.call_args) return;
            const thirdUl = createUl();
            thirdUl.classList.add("plugin-menu-third");
            thirdUl.setAttribute("plugin_name", plugin.name);
            thirdUl.innerHTML = plugin.call_args.map(arg => createThirdLi(arg)).join("");
            document.querySelector("content").appendChild(thirdUl);
        })
    }

    const createSecondLi = plugin => {
        const style = (plugin.clickable) ? "" : `style="pointer-events: none;color: #c4c6cc;"`;
        const content = (!plugin.call_args) ? plugin.name : `<span data-lg="Menu">${plugin.name}</span> <i class="fa fa-caret-right"></i>`;
        const className = (!plugin.call_args) ? "" : `class="plugin-has-args"`;
        return `<li data-key="${plugin.name}" ${className} ${style}><a role="menuitem" data-lg="Menu">${content}</a></li>`
    }

    const createThirdLi = arg => `<li data-key="${arg.arg_name}" arg_value="${arg.arg_value}"><a role="menuitem" data-lg="Menu">${arg.arg_name}</a></li>`

    const createUl = () => {
        const secondUl = document.createElement("ul");
        secondUl.classList.add("dropdown-menu");
        secondUl.classList.add("context-menu");
        secondUl.classList.add("ext-context-menu");
        secondUl.setAttribute("role", "menu");
        return secondUl;
    }

    const show = (element, target) => {
        const selected = $(element).addClass("show")
            , height = selected.height() + 48
            , offset = target.offset()
            , left = offset.left
            , leftPlus = left + 200
            , top = offset.top - 30
            , finalLeft = leftPlus + 160 > window.innerWidth ? left - 184 : leftPlus
            , finalTop = top + height > window.innerHeight ? window.innerHeight - height : top;
        selected.css({top: finalTop + "px", left: finalLeft + "px"})
        return false;
    };

    const listen = enablePlugins => {
        // 在二级菜单中调用插件
        $("#plugin-menu").on("click", "[data-key]", function () {
            const name = this.getAttribute("data-key");
            const plugins = enablePlugins.filter(plugin => plugin.name === name);
            plugins && plugins[0] && plugins[0].call && plugins[0].call();
            File.editor.contextMenu.hide();
            // 展示二级菜单
        }).on("mouseenter", "[data-key]", function () {
            const t = $(this);
            const target = t.find(`span[data-lg="Menu"]`);
            if (target.length) {
                const name = t.attr("data-key");
                show(`.plugin-menu-third[plugin_name="${name}"]`, t);
            } else {
                document.querySelectorAll(".plugin-menu-third").forEach(ele => ele.classList.remove("show"));
                document.querySelector("#plugin-menu .plugin-has-args").classList.remove("active");
            }
        })
        // 展示三级菜单
        $("#context-menu").on("mouseenter", "[data-key]", function () {
            const target = $(this);
            if ("typora-plugin" === target.attr("data-key")) {
                show("#plugin-menu", target);
                target.addClass("active");
            } else {
                document.querySelector("#plugin-menu").classList.remove("show");
                document.querySelector("[data-key='typora-plugin']").classList.remove("active");
                document.querySelectorAll(".plugin-menu-third").forEach(ele => ele.classList.remove("show"));
            }
        })
        // 在三级菜单中调用插件
        $(".plugin-menu-third").on("click", "[data-key]", function () {
            const pluginName = this.parentElement.getAttribute("plugin_name");
            const argValue = this.getAttribute("arg_value");
            const plugins = enablePlugins.filter(plugin => plugin.name === pluginName);
            plugins && plugins[0] && plugins[0].call && plugins[0].call(argValue);
            File.editor.contextMenu.hide();
        })
    }

    const appendMenu = () => {
        setTimeout(() => {
            const {clickable, nonClickable, enable} = getPlugins();
            // 一级菜单汇总所有插件
            appendFirst();
            // 二级菜单展示所有插件
            appendSecond(clickable, nonClickable);
            // 三级菜单展示插件的参数
            appendThird(enable);
            listen(enable);
        }, 500)
    }

    const _timer = setInterval(() => {
        if (global._plugins_had_injected) {
            clearInterval(_timer);
            appendMenu();
        }
    }, config.LOOP_DETECT_INTERVAL);

    module.exports = {config};

    console.log("right_click_menu.js had been injected");
})()