import logging
import colorlog
import json
import os

def logging_setup():

    os.makedirs(os.path.join("logger", "logs"), exist_ok=True)
    with open(os.path.join("logger", "logger_config.json"), "r") as f:
        config = json.load(f)
    
    logging.config.dictConfig(config)
    logger = logging.getLogger(__name__)
    return logger