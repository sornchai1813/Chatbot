module.exports = {
	setGroup: process.env.SET_GROUP || '*',
	questionSource: process.env.QUESTION_SOURCE || 'sheet',
	sheetStrict: process.env.SHEET_STRICT !== 'false',
	maxParallelGroups: Number(process.env.MAX_PARALLEL_GROUPS || 3),

	chat: {
		url: process.env.CHAT_URL || 'https://live-chat-static.sprinklr.com/test-html/index.html?appId=6950dbcf3047873387304feb_app_1111009341&env=prod11&skin=MODERN&locale=th',
	},

	timeouts: {
		testMs: Number(process.env.TEST_TIMEOUT_MS || 600000),
		botReplyMs: Number(process.env.BOT_REPLY_TIMEOUT_MS || 90000),
		typingHiddenMs: Number(process.env.TYPING_HIDDEN_TIMEOUT_MS || 60000),
	},

	waits: {
		afterSendMs: Number(process.env.WAIT_AFTER_SEND_MS || 1500),
		betweenQuestionsMs: Number(process.env.WAIT_BETWEEN_QUESTIONS_MS || 1500),
		afterInitialViewportMs: Number(process.env.WAIT_AFTER_INITIAL_VIEWPORT_MS || 1000),
		afterScrollBottomMs: Number(process.env.WAIT_AFTER_SCROLL_BOTTOM_MS || 1500),
		afterExpandUiMs: Number(process.env.WAIT_AFTER_EXPAND_UI_MS || 1200),
		afterScrubMs: Number(process.env.WAIT_AFTER_SCRUB_MS || 1800),
		afterFinalViewportMs: Number(process.env.WAIT_AFTER_FINAL_VIEWPORT_MS || 1000),
	},

	screenshot: {
		width: Number(process.env.SCREENSHOT_WIDTH || 500),
		minViewHeight: Number(process.env.MIN_VIEW_HEIGHT || 2400),
		maxViewHeight: Number(process.env.MAX_VIEW_HEIGHT || 30000),
		extraBottomPx: Number(process.env.EXTRA_BOTTOM_PX || 300),
		scrubStepPx: Number(process.env.SCRUB_STEP_PX || 500),
	},
};
