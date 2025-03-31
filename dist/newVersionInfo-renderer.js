const setInfos = (md) => {

    const converter = new showdown.Converter();
    converter.setOption('headerLevelStart', 2);
    converter.setOption('tasklists', true);
    converter.setOption('ghCompatibleHeaderId', true);
    converter.setOption('rawHeaderId', true);
    converter.setOption('literalMidWordAsterisks', true);
    converter.setOption('strikethrough', true);
    converter.setOption('tables', true);
    converter.setOption('ghCodeBlocks', true);
    converter.setOption('tablesHeaderId', true);
    converter.setOption('simpleLineBreaks', true);
    converter.setOption('openLinksInNewWindow', true);
    converter.setOption('backslashEscapesHTMLTags', true);
    converter.setOption('emoji', true);
    converter.setOption('simplifiedAutoLink', true);
    converter.setOption('parseImgDimensions', true);
    converter.setOption('excludeTrailingPunctuationFromURLs', true);
    converter.setFlavor('github');

    const html = converter.makeHtml(md);
    document.getElementById("markdown").innerHTML = html;

}


async function setSettingsXel(interface) {
    if (interface && interface.screen?.xeltheme) {
      document
      .querySelector('meta[name="xel-theme"]')
      .setAttribute('content', '../../node_modules/xel/themes/' + interface.screen.xeltheme + '.css');
      
      document.querySelector('meta[name="xel-accent-color"]').setAttribute('content', interface.screen.xelcolor);
      
      document
      .querySelector('meta[name="xel-icons"]')
      .setAttribute('content', '../../node_modules/xel/icons/' + interface.screen.xelicons + '.svg');
    }
}


window.electronAPI.onInitApp(async (_event, arg, interface) => {
    await setSettingsXel(interface);
    setInfos(arg);
});