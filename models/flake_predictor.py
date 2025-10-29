#!/usr/bin/env python3
"""
Flake Predictor MVP - Primeiro modelo de ML para QA Preditivo

Este script demonstra como implementar um modelo básico de machine learning
para prever a probabilidade de um teste apresentar comportamento flaky.

Uso:
    python models/flake_predictor.py --train
    python models/flake_predictor.py --predict --test-context '{"name": "hero test", "browser": "chromium", ...}'
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, confusion_matrix
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib
import json
import argparse
from datetime import datetime, timedelta
import os

class FlakePredictor:
    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_columns = [
            'hour_of_day', 'day_of_week', 'recent_flake_rate',
            'test_complexity', 'network_stability', 'selectors_count',
            'async_operations', 'code_coverage_change', 'browser_chromium',
            'browser_firefox', 'browser_webkit'
        ]

    def generate_mock_data(self, num_samples=10000):
        """Gera dados mock para demonstração"""
        np.random.seed(42)

        data = {
            'timestamp': [datetime.now() - timedelta(days=np.random.randint(0, 90))
                         for _ in range(num_samples)],
            'test_name': [f'test_{i}' for i in range(num_samples)],
            'browser': np.random.choice(['chromium', 'firefox', 'webkit'], num_samples),
            'duration': np.random.normal(120, 30, num_samples),  # segundos
            'selectors_count': np.random.poisson(5, num_samples),
            'async_operations': np.random.poisson(2, num_samples),
            'network_stability': np.random.uniform(0.5, 1.0, num_samples),
            'code_coverage_change': np.random.normal(0, 0.05, num_samples),
            'is_flaky': np.random.choice([0, 1], num_samples, p=[0.85, 0.15])  # 15% flaky
        }

        df = pd.DataFrame(data)

        # Adiciona features derivadas
        df['hour_of_day'] = df.timestamp.dt.hour
        df['day_of_week'] = df.timestamp.dt.dayofweek

        # Calcula taxa recente de flakes (simulação)
        df['recent_flake_rate'] = df.groupby('test_name')['is_flaky'].transform(
            lambda x: x.rolling(10, min_periods=1).mean()
        )

        # Complexidade do teste baseada em seletores e async ops
        df['test_complexity'] = (df.selectors_count * 0.3) + (df.async_operations * 0.7)

        return df

    def preprocess_data(self, df):
        """Pré-processa dados para ML"""
        df_processed = df.copy()

        # Codificação one-hot para browser
        browser_dummies = pd.get_dummies(df_processed.browser, prefix='browser')
        df_processed = pd.concat([df_processed, browser_dummies], axis=1)

        # Garante que todas as colunas de browser existem
        for browser in ['chromium', 'firefox', 'webkit']:
            col_name = f'browser_{browser}'
            if col_name not in df_processed.columns:
                df_processed[col_name] = 0

        # Seleciona apenas as features necessárias
        feature_df = df_processed[self.feature_columns]

        # Escala features numéricas
        numeric_features = ['recent_flake_rate', 'test_complexity', 'network_stability',
                          'selectors_count', 'async_operations', 'code_coverage_change']

        if hasattr(self, 'scaler') and hasattr(self.scaler, 'mean_'):
            feature_df[numeric_features] = self.scaler.transform(feature_df[numeric_features])
        else:
            feature_df[numeric_features] = self.scaler.fit_transform(feature_df[numeric_features])

        return feature_df, df_processed.is_flaky

    def train(self, df):
        """Treina o modelo"""
        print("🎯 Iniciando treinamento do modelo de flakes...")

        X, y = self.preprocess_data(df)
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        print(f"📊 Dados de treinamento: {X_train.shape[0]} amostras")
        print(f"📊 Dados de teste: {X_test.shape[0]} amostras")
        print(f"📊 Distribuição de classes: {y_train.value_counts().to_dict()}")

        # Treina modelo
        self.model.fit(X_train, y_train)

        # Avalia performance
        y_pred = self.model.predict(X_test)
        y_pred_proba = self.model.predict_proba(X_test)[:, 1]

        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred)
        recall = recall_score(y_test, y_pred)

        print("
📈 Performance do Modelo:"        print(".3f"        print(".3f"        print(".3f"

        # Feature importance
        feature_importance = dict(zip(X.columns, self.model.feature_importances_))
        print("
🔍 Top 5 Features Mais Importantes:"        sorted_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
        for feature, importance in sorted_features[:5]:
            print(".3f"
        # Matriz de confusão
        cm = confusion_matrix(y_test, y_pred)
        print("
📊 Matriz de Confusão:"        print(f"              Predito Não-Flaky | Predito Flaky")
        print(f"Real Não-Flaky     {cm[0][0]:<12} | {cm[0][1]}")
        print(f"Real Flaky         {cm[1][0]:<12} | {cm[1][1]}")

        return {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'feature_importance': feature_importance
        }

    def predict_flake_probability(self, test_context):
        """Prediz probabilidade de flake para um teste específico"""
        # Converte contexto em DataFrame
        context_df = pd.DataFrame([test_context])

        # Adiciona features derivadas
        context_df['hour_of_day'] = pd.to_datetime(context_df.get('timestamp', datetime.now())).dt.hour
        context_df['day_of_week'] = pd.to_datetime(context_df.get('timestamp', datetime.now())).dt.dayofweek
        context_df['recent_flake_rate'] = context_df.get('recent_flake_rate', 0.1)
        context_df['test_complexity'] = (context_df.get('selectors_count', 0) * 0.3) + \
                                      (context_df.get('async_operations', 0) * 0.7)
        context_df['network_stability'] = context_df.get('network_stability', 0.8)
        context_df['code_coverage_change'] = context_df.get('code_coverage_change', 0)

        # One-hot encoding para browser
        browser = context_df.get('browser', 'chromium').iloc[0]
        for b in ['chromium', 'firefox', 'webkit']:
            context_df[f'browser_{b}'] = 1 if browser == b else 0

        # Seleciona e ordena features
        features = context_df[self.feature_columns]

        # Escala features
        numeric_features = ['recent_flake_rate', 'test_complexity', 'network_stability',
                          'selectors_count', 'async_operations', 'code_coverage_change']
        features[numeric_features] = self.scaler.transform(features[numeric_features])

        # Predição
        probability = self.model.predict_proba(features)[0][1]

        # Interpretação do risco
        if probability > 0.7:
            risk_level = '🔴 ALTO'
            recommendation = 'Executar com prioridade alta, considerar skip se deadline apertado'
        elif probability > 0.4:
            risk_level = '🟡 MÉDIO'
            recommendation = 'Monitorar de perto, executar em horário de baixa carga'
        else:
            risk_level = '🟢 BAIXO'
            recommendation = 'Executar normalmente, baixo risco de problemas'

        return {
            'probability': probability,
            'risk_level': risk_level,
            'recommendation': recommendation,
            'confidence_factors': self.analyze_confidence_factors(features.iloc[0])
        }

    def analyze_confidence_factors(self, features):
        """Analisa fatores que contribuem para a confiança da predição"""
        factors = []

        if features.recent_flake_rate > 0.2:
            factors.append("Histórico recente de flakes aumenta probabilidade")
        if features.test_complexity > 5:
            factors.append("Teste complexo (muitos seletores/async ops)")
        if features.network_stability < 0.7:
            factors.append("Condições de rede instáveis")
        if abs(features.code_coverage_change) > 0.1:
            factors.append("Mudanças significativas na cobertura de código")

        return factors if factors else ["Nenhum fator de risco específico identificado"]

    def save_model(self, path='models/flake_predictor.joblib'):
        """Salva modelo treinado"""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'label_encoders': self.label_encoders,
            'feature_columns': self.feature_columns
        }, path)
        print(f"💾 Modelo salvo em: {path}")

    def load_model(self, path='models/flake_predictor.joblib'):
        """Carrega modelo salvo"""
        if os.path.exists(path):
            saved = joblib.load(path)
            self.model = saved['model']
            self.scaler = saved['scaler']
            self.label_encoders = saved['label_encoders']
            self.feature_columns = saved['feature_columns']
            print(f"📂 Modelo carregado de: {path}")
            return True
        else:
            print(f"❌ Modelo não encontrado: {path}")
            return False


def main():
    parser = argparse.ArgumentParser(description='Flake Predictor MVP')
    parser.add_argument('--train', action='store_true', help='Treinar modelo')
    parser.add_argument('--predict', action='store_true', help='Fazer predição')
    parser.add_argument('--test-context', type=str, help='Contexto do teste em JSON')
    parser.add_argument('--save-model', action='store_true', help='Salvar modelo após treinamento')
    parser.add_argument('--load-model', action='store_true', help='Carregar modelo salvo')

    args = parser.parse_args()

    predictor = FlakePredictor()

    if args.load_model:
        predictor.load_model()

    if args.train:
        # Gera dados mock e treina
        print("🔧 Gerando dados de treinamento...")
        df = predictor.generate_mock_data(5000)

        results = predictor.train(df)

        print(f"\n✅ Treinamento concluído!")
        print(f"   Accuracy: {(results.accuracy * 100):.1f}%")
        print(f"   Precision: {(results.precision * 100):.1f}%")
        print(f"   Recall: {(results.recall * 100):.1f}%")

        if args.save_model:
            predictor.save_model()

    elif args.predict:
        if not args.test_context:
            print("❌ Use --test-context para fornecer dados do teste")
            return

        try:
            test_context = json.loads(args.test_context)
        except:
            print("❌ Erro ao parsear --test-context. Use JSON válido.")
            return

        if not predictor.load_model():
            print("❌ Modelo não encontrado. Treine primeiro com --train --save-model")
            return

        prediction = predictor.predict_flake_probability(test_context)

        print("🔮 PREDIÇÃO DE FLAKE"        print("=" * 50)
        print(".1f"        print(f"Nível de Risco: {prediction.risk_level}")
        print(f"Recomendação: {prediction.recommendation}")

        if prediction.confidence_factors:
            print("
🎯 Fatores de Confiança:"            prediction.confidence_factors.forEach(factor => {
                print(f"   • {factor}")
            })

    else:
        print("🤖 Flake Predictor MVP")
        print("")
        print("Comandos disponíveis:")
        print("  --train                    Treinar modelo")
        print("  --train --save-model       Treinar e salvar modelo")
        print("  --load-model --predict --test-context '{\"name\": \"test\", ...}'")
        print("                             Carregar modelo e fazer predição")
        print("")
        print("Exemplo de test-context:")
        print('  \'{"name": "hero test", "browser": "chromium", "selectors_count": 5, "async_operations": 2, "network_stability": 0.8, "recent_flake_rate": 0.1}\'')


if __name__ == '__main__':
    main()
