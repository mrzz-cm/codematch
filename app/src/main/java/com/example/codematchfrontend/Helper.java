package com.example.codematchfrontend;

import android.content.Context;
import android.content.res.Resources;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

final class Helper {

    /**
     * Retrieve a configuration entry
     *
     * @param context Class context
     * @param name    Name of property being requested
     * @return Property requested
     * @throws Resources.NotFoundException Unable to find the config file
     * @throws IOException                 Failed reading configuration file
     */
    protected static String getConfigValue(Context context, String name)
            throws Resources.NotFoundException, IOException {

        // Retrieve raw resources
        Resources resources = context.getResources();
        InputStream rawResource = resources.openRawResource(R.raw.config);

        Properties properties = new Properties();

        // Read raw config
        properties.load(rawResource);
        return properties.getProperty(name);
    }
}