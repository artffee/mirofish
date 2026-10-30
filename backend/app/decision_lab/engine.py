"""Bounded synthetic decisions. Counts describe these six agents only."""
from collections import Counter
from copy import deepcopy
from datetime import datetime, timezone
from hashlib import sha256
import json
import math

from ..models.agent_profile import OasisAgentProfile

VERSION = 'decision-lab/1.0'
NOTICE = ('Synthetic responses, not customer research. No human validation, measured confidence, '
          'purchase probability, or population estimate is available.')
FEATURES = {
    'value': 'Value', 'originality': 'Originality', 'simplicity': 'Simplicity',
    'local_story': 'Local story', 'practicality': 'Practicality', 'premium_finish': 'Premium finish',
}
# Deliberately invented perspectives, not inferred demographics or sampled customers.
LENSES = [
    ('Value seeker', {'value': 3, 'practicality': 1}, 0.75),
    ('Design explorer', {'originality': 3, 'premium_finish': 1}, 1.5),
    ('Minimalist', {'simplicity': 3, 'practicality': 1}, 1.0),
    ('Local supporter', {'local_story': 3, 'originality': 1}, 1.25),
    ('Practical buyer', {'practicality': 3, 'value': 1}, 1.0),
    ('Cautious buyer', {'value': 1, 'simplicity': 1}, 0.75),
]


class InputError(ValueError):
    pass


def text_field(value, name, maximum, required=True):
    if not isinstance(value, str) or len(value) > maximum or (required and not value.strip()):
        raise InputError(f'{name} must be text between {1 if required else 0} and {maximum} characters.')
    return value.strip()


def number(value, name, minimum=0):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not minimum <= value <= 100000:
        raise InputError(f'{name} must be a finite number from {minimum} to 100000.')
    return round(value, 2)


def validate_request(raw):
    if not isinstance(raw, dict):
        raise InputError('Send a JSON object.')
    allowed = {'audience', 'question', 'scenario', 'context', 'budget', 'alternatives', 'mode'}
    if set(raw) - allowed:
        raise InputError('Unsupported fields. Attachments, provider settings and credentials are not accepted.')
    mode = raw.get('mode', 'fixture')
    if mode not in ('fixture', 'local_llm'):
        raise InputError('Choose fixture or local_llm mode.')
    clean = {key: text_field(raw.get(key, ''), key, limit, required) for key, limit, required in [
        ('audience', 700, True), ('question', 700, True), ('scenario', 1400, True), ('context', 6000, False)]}
    clean.update(mode=mode, budget=number(raw.get('budget'), 'budget', 0.01))
    options = raw.get('alternatives')
    if not isinstance(options, list) or not 2 <= len(options) <= 3:
        raise InputError('Provide two or three alternatives.')
    clean['alternatives'] = []
    for option in options:
        if not isinstance(option, dict) or set(option) - {'id', 'title', 'description', 'price', 'features'}:
            raise InputError('Each alternative needs id, title, description, price and features only.')
        option_id = option.get('id')
        if option_id not in ('A', 'B', 'C'):
            raise InputError('Alternative IDs must be A, B or C.')
        features = option.get('features', [])
        if not isinstance(features, list) or len(features) > len(FEATURES) or any(not isinstance(f, str) or f not in FEATURES for f in features) or len(set(features)) != len(features):
            raise InputError('Choose unique attributes from the supplied list.')
        clean['alternatives'].append({
            'id': option_id,
            'title': text_field(option.get('title'), 'title', 100),
            'description': text_field(option.get('description'), 'description', 1200),
            'price': None if option.get('price') is None else number(option['price'], 'price'),
            'features': sorted(features),
        })
    if len({o['id'] for o in clean['alternatives']}) != len(options):
        raise InputError('Alternative IDs must be unique.')
    if len({o['title'].casefold() for o in clean['alternatives']}) != len(options):
        raise InputError('Give each alternative a distinct title.')
    return clean


def panel(study):
    return [
        {'profile': OasisAgentProfile(
            user_id=i, user_name=f'synthetic_{i+1}', name=name,
            bio='Invented decision lens; not a real person.',
            persona=f'Invented {name.lower()} perspective for the stated audience: {study["audience"]}',
            interested_topics=list(weights), created_at='2026-10-30').to_dict(),
         'weights': weights, 'budget_limit': round(study['budget'] * factor, 2)}
        for i, (name, weights, factor) in enumerate(LENSES)
    ]


def fixture_response(study, agent):
    evaluations = []
    for option in study['alternatives']:
        matches = [f for f in option['features'] if f in agent['weights']]
        points = sum(agent['weights'][f] for f in matches)
        over_budget = option['price'] is not None and option['price'] > agent['budget_limit']
        utility = points - (4 if over_budget else 0)
        evaluations.append({
            'alternative_id': option['id'], 'rule_points': utility,
            'appeal': 'Matching assigned attributes: ' + (', '.join(FEATURES[f] for f in matches) or 'none') + '.',
            'concern': (f'Price exceeds this invented budget limit ({agent["budget_limit"]:.2f}).' if over_budget else
                        'No price was supplied; affordability is unknown.' if option['price'] is None else
                        'Price is within the invented budget; willingness to pay remains unknown.'),
        })
    highest = max(e['rule_points'] for e in evaluations)
    best = [e for e in evaluations if e['rule_points'] == highest]
    choice = best[0]['alternative_id'] if highest > 0 and len(best) == 1 else 'none'
    reason = ('The assigned attributes and budget rule give this option a unique positive total.' if choice != 'none' else
              'No clear preference: the rules tie or no alternative has a positive total.')
    return {'agent_id': agent['profile']['user_id'], 'choice': choice, 'reason': reason,
            'tradeoff': 'Descriptions, audience wording, scenario and reference notes are recorded but not interpreted by this rules demo.',
            'follow_up': 'Ask real people what would make them prefer or reject each option.', 'evaluations': evaluations}


def validate_model_response(raw, study, agent):
    """Allowlist structured model output; never accept model-generated statistics."""
    if not isinstance(raw, dict) or set(raw) != {'choice', 'reason', 'tradeoff', 'follow_up', 'evaluations'}:
        raise InputError('Model output did not match the response schema.')
    ids = {o['id'] for o in study['alternatives']}
    if not isinstance(raw['choice'], str) or raw['choice'] not in ids | {'none'}:
        raise InputError('Model returned an invalid choice.')
    result = {'agent_id': agent['profile']['user_id'], 'choice': raw['choice']}
    for key in ('reason', 'tradeoff', 'follow_up'):
        result[key] = text_field(raw[key], key, 900)
    evaluations = raw['evaluations']
    if not isinstance(evaluations, list) or len(evaluations) != len(ids):
        raise InputError('Model must evaluate every alternative.')
    normalized = []
    for e in evaluations:
        if not isinstance(e, dict) or set(e) != {'alternative_id', 'appeal', 'concern'} or not isinstance(e['alternative_id'], str) or e['alternative_id'] not in ids:
            raise InputError('Invalid model evaluation.')
        normalized.append({'alternative_id': e['alternative_id'], 'appeal': text_field(e['appeal'], 'appeal', 600), 'concern': text_field(e['concern'], 'concern', 600)})
    if {e['alternative_id'] for e in normalized} != ids:
        raise InputError('Model omitted or duplicated an alternative.')
    result['evaluations'] = normalized
    return result


def run_study(raw, provider=None):
    study = validate_request(raw)
    if study['mode'] == 'local_llm' and provider is None:
        raise InputError('Local model is disabled. Use the rules demo or configure an approved local model.')
    agents = panel(study)
    responses = []
    for index, agent in enumerate(agents):
        if study['mode'] == 'fixture':
            responses.append(fixture_response(study, agent))
        else:
            # Rotate a canonical order; UI ordering does not change model presentation.
            presented = deepcopy(study)
            options = sorted(presented['alternatives'], key=lambda o: o['id'])
            offset = index % len(options)
            presented['alternatives'] = options[offset:] + options[:offset]
            responses.append(validate_model_response(provider.respond(presented, agent), study, agent))
    counts = Counter(r['choice'] for r in responses)
    alternatives = study['alternatives'] + [{'id': 'none', 'title': 'None / no clear preference'}]
    comparison = [{'id': o['id'], 'title': o['title'], 'count': counts[o['id']],
                   'share_of_synthetic_panel': round(counts[o['id']] / len(agents) * 100, 1)} for o in alternatives]
    canonical = json.dumps(study, sort_keys=True, ensure_ascii=False)
    return {
        'schema_version': VERSION,
        'run_id': sha256((VERSION + canonical + json.dumps(responses, sort_keys=True)).encode()).hexdigest()[:16],
        'created_at': datetime.now(timezone.utc).isoformat(), 'notice': NOTICE,
        'method': {
            'mode': study['mode'], 'engine': 'deterministic-rules-v1' if study['mode'] == 'fixture' else 'local-language-model',
            'model': None if study['mode'] == 'fixture' else provider.model,
            'validation_status': 'Not validated against human responses',
            'human_participants': 0, 'synthetic_agents': len(agents),
            'confidence': None, 'predictive_accuracy': None,
            'limitations': [
                'Six invented perspectives; no population sampling or demographic representativeness.',
                'Shared model or rules can produce correlated errors. Larger synthetic counts do not validate accuracy.',
                'Images are browser-only previews and are never analyzed.',
                'Only assigned attributes and prices affect fixture choices; text is context only in local-model mode.',
                'Local-model opinions are AI-generated hypotheses; rules-demo responses are templates.',
            ],
        },
        'study': study, 'panel': agents, 'responses': responses, 'comparison': comparison,
        'next_steps': [
            'Show these alternatives in varied order to people from the intended audience.',
            'Collect unaided reasons, objections and a none-of-these response before revealing these hypotheses.',
            'Use a consented real-world test to measure behavior; keep its results separate from this simulation.',
        ],
    }
