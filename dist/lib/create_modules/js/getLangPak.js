Locale = await Avatar.lang.getPak("create_module", data.language);
        if (!Locale) {
            throw new Error (`create_module: Unable to find the '${data.language}' language pak.`);
        }