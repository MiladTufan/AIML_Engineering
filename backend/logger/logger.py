import logging
import colorlog
import json
import os

def logging_setup():

    with open(os.path.join("logger", "logger_config.json"), "r") as f:
        config = json.load(f)
    
    logging.config.dictConfig(config)
    logger = logging.getLogger(__name__)
    return logger