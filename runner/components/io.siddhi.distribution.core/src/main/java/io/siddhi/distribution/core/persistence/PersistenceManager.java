/*
 * Copyright (c) 2017, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

package io.siddhi.distribution.core.persistence;

import io.siddhi.core.SiddhiAppRuntime;
import io.siddhi.core.util.snapshot.PersistenceReference;
import io.siddhi.distribution.core.internal.StreamProcessorDataHolder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.ConcurrentMap;

/**
 * Class that manages the periodic persistence of Siddhi Applications.
 */
public class PersistenceManager implements Runnable {

    private static final Logger log = LoggerFactory.getLogger(PersistenceManager.class);

    public PersistenceManager() {
    }

    @Override
    public void run() {
        persist();
    }

    private void persist() {
        ConcurrentMap<String, SiddhiAppRuntime> siddhiAppRuntimeMap = StreamProcessorDataHolder.
                getSiddhiManager().getSiddhiAppRuntimeMap();
        for (SiddhiAppRuntime siddhiAppRuntime : siddhiAppRuntimeMap.values()) {
            PersistenceReference persistenceReference = siddhiAppRuntime.persist();
            if (log.isDebugEnabled()) {
                log.debug("Revision " + persistenceReference.getRevision() +
                        " of siddhi App " + siddhiAppRuntime.getName() + " persisted successfully");
            }
        }
        if (StreamProcessorDataHolder.getNodeInfo() != null) {
            StreamProcessorDataHolder.getNodeInfo().setLastPersistedTimestamp(System.currentTimeMillis());
        }
    }
}
