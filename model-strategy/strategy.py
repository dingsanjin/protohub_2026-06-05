import json
import os
from typing import List, Dict, Optional

CONFIG_PATH = os.path.join(os.path.dirname(__file__), 'config.json')

class ModelStrategyManager:
    def __init__(self):
        self.load_config()

    def load_config(self):
        if os.path.exists(CONFIG_PATH):
            with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
                self.config = json.load(f)
        else:
            self.config = {
                "models": [],
                "strategies": {}
            }

    def save_config(self):
        with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
            json.dump(self.config, f, indent=2, ensure_ascii=False)

    def add_model(self, model_name: str, provider: str, model_id: str, description: str = ""):
        existing_model = next((m for m in self.config["models"] if m["name"] == model_name), None)
        if existing_model:
            return {"success": False, "message": f"模型 '{model_name}' 已存在"}
        
        self.config["models"].append({
            "name": model_name,
            "provider": provider,
            "model_id": model_id,
            "description": description
        })
        self.save_config()
        return {"success": True, "message": f"模型 '{model_name}' 已添加"}

    def remove_model(self, model_name: str):
        self.config["models"] = [m for m in self.config["models"] if m["name"] != model_name]
        for strategy_name in self.config["strategies"]:
            self.config["strategies"][strategy_name]["model_priority"] = [
                m for m in self.config["strategies"][strategy_name]["model_priority"] 
                if m != model_name
            ]
        self.save_config()
        return {"success": True, "message": f"模型 '{model_name}' 已删除"}

    def set_strategy_priority(self, strategy_name: str, model_priority: List[str]):
        if strategy_name not in self.config["strategies"]:
            return {"success": False, "message": f"策略 '{strategy_name}' 不存在"}
        
        valid_models = [m["name"] for m in self.config["models"]]
        invalid_models = [m for m in model_priority if m not in valid_models]
        if invalid_models:
            return {"success": False, "message": f"以下模型不存在: {', '.join(invalid_models)}"}
        
        self.config["strategies"][strategy_name]["model_priority"] = model_priority
        self.save_config()
        return {"success": True, "message": f"策略 '{strategy_name}' 的模型优先级已更新"}

    def classify_task(self, user_input: str) -> str:
        user_input_lower = user_input.lower()
        
        for strategy_name, strategy in self.config["strategies"].items():
            if strategy_name == "default":
                continue
            for keyword in strategy["keywords"]:
                if keyword in user_input_lower:
                    return strategy_name
        
        return "default"

    def select_model(self, user_input: str) -> Dict:
        strategy_name = self.classify_task(user_input)
        strategy = self.config["strategies"].get(strategy_name)
        
        if not strategy or not strategy["model_priority"]:
            if self.config["strategies"]["default"]["model_priority"]:
                selected_model_name = self.config["strategies"]["default"]["model_priority"][0]
                strategy_name = "default"
            else:
                return {
                    "success": False,
                    "message": "未配置任何模型",
                    "strategy": None,
                    "model": None
                }
        else:
            selected_model_name = strategy["model_priority"][0]
        
        selected_model = next((m for m in self.config["models"] if m["name"] == selected_model_name), None)
        
        return {
            "success": True,
            "message": f"任务类型: {strategy['name']}, 选择模型: {selected_model_name}",
            "strategy": {
                "name": strategy_name,
                "display_name": strategy["name"]
            },
            "model": selected_model
        }

    def get_all_models(self) -> List[Dict]:
        return self.config["models"]

    def get_all_strategies(self) -> Dict:
        return self.config["strategies"]

    def print_config(self):
        print("=== 模型策略配置 ===")
        print("\n【已注册模型】")
        for i, model in enumerate(self.config["models"], 1):
            print(f"{i}. {model['name']} ({model['provider']})")
            if model.get('description'):
                print(f"   描述: {model['description']}")
        
        print("\n【策略配置】")
        for strategy_name, strategy in self.config["strategies"].items():
            print(f"\n{strategy['name']} ({strategy_name}):")
            print(f"  关键词: {', '.join(strategy['keywords'])[:50]}...")
            print(f"  模型优先级: {', '.join(strategy['model_priority']) or '未配置'}")

if __name__ == "__main__":
    manager = ModelStrategyManager()
    manager.print_config()