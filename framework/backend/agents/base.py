from abc import ABC, abstractmethod

class BaseAgent(ABC):
    def __init__(self, name: str = None, config: dict = None):
        self.name = name or self.__class__.__name__
        self.config = config or {}

    @abstractmethod
    def run(self, message: str) -> str:
        """
        Process the input message and return a response.
        """
        pass
