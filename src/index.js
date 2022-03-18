import getEmailAddresses from './email'

global.getEmailAddresses = getEmailAddresses

global.doGet = (e) => {
    const text = '<b>I love Google</b>'
    const output = HtmlService.createHtmlOutput(text)
    output.setTitle(text)
    output.addMetaTag('viewport', 'width=device-width, initial-scale=1')
    output.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    return output
}
