import React, { useMemo, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import Icon from '@mdi/react';
import { mdiClipboardCheck } from '@mdi/js';

import SEO from '../../components/SEO';
import ErrorPage from '../../components/error-page';
import TaskSearch from '../../components/task-search';
import LoadingSmall from '../../components/loading-small';
import ItemImage from '../../components/item-image';

import { selectQuests, fetchQuests } from '../../features/quests/questsSlice';
import { useTradersQuery } from '../../features/traders/queries';
import { useItemsQuery } from '../../features/items/queries';
import { useMapsQuery, useMapImages } from '../../features/maps/queries';

import './index.css';

function Quest() {
    const settings = useSelector((state) => state.settings);
    const { taskIdentifier } = useParams();
    const { t } = useTranslation();

    const loadingData = {
        name: t('Loading...'),
        factionName: 'Any',
        trader: {
            name: t('Loading...'),
            normalizedName: 'flea-market'
        },
        objectives: [],
        loading: true,
    };

    const tradersResult = useTradersQuery();
    const traders = useMemo(() => {
        return tradersResult.data;
    }, [tradersResult]);

    const itemsResult = useItemsQuery();
    const items = useMemo(() => {
        return itemsResult.data;
    }, [itemsResult]);

    const mapsResult = useMapsQuery();
    const maps = useMemo(() => {
        return mapsResult.data;
    }, [mapsResult]);

    const mapImages = useMapImages();

    const dispatch = useDispatch();
    const quests = useSelector(selectQuests);
    const questsStatus = useSelector((state) => {
        return state.quests.status;
    });

    useEffect(() => {
        let timer = false;
        if (questsStatus === 'idle') {
            dispatch(fetchQuests());
        }

        if (!timer) {
            timer = setInterval(() => {
                dispatch(fetchQuests());
            }, 600000);
        }

        return () => {
            clearInterval(timer);
        };
    }, [questsStatus, dispatch]);

    let currentQuest = useMemo(() => {
        return quests.find((quest) => {
            if (quest.id === taskIdentifier) {
                return true;
            }
            if (String(quest.tarkovDataId) === taskIdentifier) {
                return true;
            }
            if (quest.normalizedName === (taskIdentifier ? String(taskIdentifier).toLowerCase() : '')) {
                return true;
            }
            return false;
        });
    }, [quests, taskIdentifier]);

    // if the name we got from the params are the id of the item, redirect
    // to a nice looking path
    if (currentQuest && currentQuest.normalizedName !== taskIdentifier) {
        return <Navigate to={`/task/${currentQuest.normalizedName}`} replace />;
    }

    // checks for item data loaded
    if (!currentQuest && (questsStatus === 'idle' || questsStatus === 'loading')) {
        currentQuest = loadingData;
    }

    if (!currentQuest && (questsStatus === 'succeeded' || questsStatus === 'failed')) {
        return <ErrorPage />;
    }

    const nextQuests = quests.filter((quest) =>
        quest.taskRequirements.some(
            (req) => req.task.id === currentQuest.id && !req.status.includes('active'),
        ),
    );

    let requirementsChunk = '';
    if (
        currentQuest.minPlayerLevel ||
        currentQuest.taskRequirements?.length > 0 ||
        currentQuest.traderRequirements?.length > 0
    ) {
        let playerLevel = '';
        let tasksReqs = '';
        let traderLevels = '';
        let traderReps = '';

        if (currentQuest.minPlayerLevel) {
            playerLevel = (
                <div key={'player-level-req'}>
                    {t('Player level: {{playerLevel}}', { playerLevel: currentQuest.minPlayerLevel })}
                </div>
            );
        }
        const levelReqs = currentQuest.traderRequirements.filter(req => req.requirementType === 'level');
        if (levelReqs.length > 0) {
            traderLevels = (
                <div key={'trader-level-req'}>
                    <h3>{t('Trader Levels')}</h3>
                    {levelReqs.map((traderReq) => {
                        const trader = traders.find((trad) => trad.id === traderReq.trader.id);
                        return (
                            <div key={`req-trader-${trader.id}`}>
                                <Link to={`/trader/${trader.normalizedName}`}>{trader.name}</Link>
                                <span>{` ${t('LL{{level}}', { level: traderReq.value })}`}</span>
                            </div>
                        );
                    })}
                </div>
            );
        }
        const repReqs = currentQuest.traderRequirements.filter(req => req.requirementType === 'reputation');
        if (repReqs.length > 0) {
            traderReps = (
                <div key={'trader-rep-req'}>
                    <h3>{t('Trader Reputation')}</h3>
                    {repReqs.map((traderRep) => {
                        const trader = traders.find((trad) => trad.id === traderRep.trader.id);
                        return (
                            <div key={`req-trader-${trader.id}`}>
                                <Link to={`/trader/${trader.normalizedName}`}>{trader.name}</Link>
                                <span>{` ${traderRep.compareMethod} ${traderRep.value}`}</span>
                            </div>
                        );
                    })}
                </div>
            );
        }

        if (currentQuest.taskRequirements?.length > 0) {
            tasksReqs = (
                <div key={'task-status-req'}>
                    <h3>{t('Prerequisite Tasks')}</h3>
                    {currentQuest.taskRequirements.map((taskReq) => {
                        const task = quests.find((quest) => quest.id === taskReq.task.id);
                        if (!task)
                            return null;
                        return (
                            <div key={`req-task-${task.id}`}>
                                <Link to={`/task/${task.normalizedName}`}>{task.name}</Link>
                                <span>
                                    {`: ${taskReq.status
                                        .map((taskStatus) => {
                                            // possible values for t already specified in Quests page
                                            return t(taskStatus);
                                        })
                                        .join(', ')}`}
                                </span>
                                {taskReq.status.includes('complete') && settings.completedQuests.includes(task.id) ? (
                                    <Icon
                                        path={mdiClipboardCheck}
                                        size={0.75}
                                        className="icon-with-text"
                                    />
                                ) : (
                                    ''
                                )}
                            </div>
                        );
                    })}
                </div>
            );
        }
        requirementsChunk = (
            <div key={'all-start-requirements'}>
                <h2>📋 {t('Start Requirements')}</h2>
                {playerLevel}
                {traderLevels}
                {traderReps}
                {tasksReqs}
            </div>
        );
    }

    const getObjective = (objective) => {
        let taskDetails = '';
        if (objective.type.includes('QuestItem')) {
            taskDetails = (
                <ItemImage
                    item={{
                        ...objective.questItem,
                        backgroundColor: 'yellow',
                        types: ['quest'],
                    }}
                    imageField="baseImageLink"
                    nonFunctionalOverlay={false}
                    imageViewer={true}
                />
            );
        }
        if (objective.type === 'buildWeapon') {
            let baseItem = items.find((i) => i.id === objective.item.id);
            if (!baseItem)
                return null;
            if (baseItem.properties?.defaultPreset) {
                const preset = items.find(i => i.id === baseItem.properties.defaultPreset.id);
                baseItem = {
                    ...baseItem,
                    baseImageLink: preset.baseImageLink,
                    width: preset.width,
                    height: preset.height,
                };
            }
            const attributes = objective.attributes
                .map((att) => {
                    if (!att.requirement.value) {
                        return false;
                    }
                    return att;
                })
                .filter(Boolean);
            taskDetails = (
                <>
                    <>
                        <ItemImage
                            item={baseItem}
                            imageField="baseImageLink"
                            nonFunctionalOverlay={false}
                            linkToItem={true}
                        />
                    </>
                    {attributes.length > 0 && (
                        <>
                            <h4>{t('Attributes')}</h4>
                            <ul>
                                {attributes.map((att) => {
                                    return (
                                        <li
                                            key={att.name}
                                            className={'quest-list-item'}
                                        >{`${att.name}: ${att.requirement.compareMethod} ${att.requirement.value}`}</li>
                                    );
                                })}
                            </ul>
                        </>
                    )}
                    {objective.containsAll?.length > 0 && (
                        <>
                            <h4>{t('Contains All')}</h4>
                            <ul className="quest-item-list">
                                {objective.containsAll.map((part) => {
                                    const item = items.find((i) => i.id === part.id);
                                    if (!item)
                                        return null;
                                    return (
                                        <li
                                            key={item.id}
                                        >
                                            <ItemImage
                                                item={item}
                                                imageField="baseImageLink"
                                                nonFunctionalOverlay={false}
                                                linkToItem={true}
                                            />
                                        </li>
                                    );
                                })}
                            </ul>
                        </>
                    )}
                    {objective.containsCategory?.length > 0 && (
                        <>
                            <h4>{t('Contains Item in Category')}</h4>
                            <ul>
                                {objective.containsCategory.map((cat) => {
                                    return (
                                        <li
                                            key={cat.id}
                                            className={'quest-list-item-category'}
                                        >
                                            <Link
                                                to={`/items/${cat.normalizedName}`}
                                            >
                                                {cat.name}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </>
                    )}
                </>
            );
        }
        if (objective.type === 'experience') {
            taskDetails = (
                <>
                    {t('Have the {{effectNames, list}} effect(s) on your {{bodyParts, list}} for {{operator}} {{count}} seconds', {
                            effectNames: objective.healthEffect.effects,
                            bodyParts: objective.healthEffect.bodyParts,
                            operator: objective.healthEffect.time.compareMethod,
                            count: objective.healthEffect.time.value,
                        },
                    )}
                </>
            );
        }
        if (objective.type === 'extract') {
            taskDetails = (
                <>
                    {t('Extract with the status(es): {{extractStatuses, list}}', {
                        extractStatuses: objective.exitStatus,
                    })}
                </>
            );
        }
        if (objective.type === 'giveItem' || objective.type === 'findItem') {
            let item = items.find((i) => i.id === objective.item.id);
            if (!item)
                return null;
            if (item.properties?.defaultPreset) {
                const preset = items.find(i => i.id === item.properties.defaultPreset.id);
                item = {
                    ...item,
                    baseImageLink: preset.baseImageLink,
                    width: preset.width,
                    height: preset.height,
                };
            }
            const attributes = [];
            if (objective.dogTagLevel) {
                attributes.push({
                    name: t('Dogtag level'),
                    value: objective.dogTagLevel,
                });
            }
            if (objective.maxDurability && objective.maxDurability < 100) {
                attributes.push({
                    name: t('Max durability'),
                    value: objective.maxDurability,
                });
            }
            if (objective.minDurability > 0) {
                attributes.push({
                    name: t('Min durability'),
                    value: objective.minDurability,
                });
            }
            taskDetails = (
                <>
                    <>
                    <ItemImage
                        item={item}
                        imageField="baseImageLink"
                        nonFunctionalOverlay={false}
                        linkToItem={true}
                        count={objective.count}
                        isFIR={objective.foundInRaid}
                    />
                    </>
                    {attributes.length > 0 && (
                        <ul>
                            {attributes.map((att) => {
                                return (
                                    <li
                                        key={att.name}
                                        className={'quest-list-item'}
                                    >
                                        {`${att.name}: ${att.value}`}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </>
            );
        }
        if (objective.type === 'mark') {
            const item = items.find((i) => i.id === objective.markerItem.id);
            if (!item)
                return null;
            taskDetails = (
                <>
                    <ItemImage
                        item={item}
                        imageField="baseImageLink"
                        nonFunctionalOverlay={false}
                        linkToItem={true}
                    />
                </>
            );
        }
        if (objective.type === 'plantItem') {
            let item = items.find((i) => i.id === objective.item.id);
            if (!item)
                return null;
            if (item.properties?.defaultPreset) {
                const preset = items.find(i => i.id === item.properties.defaultPreset.id);
                item = {
                    ...item,
                    baseImageLink: preset.baseImageLink,
                    width: preset.width,
                    height: preset.height,
                };
            }
            taskDetails = (
                <>
                    <ItemImage
                        item={item}
                        imageField="baseImageLink"
                        nonFunctionalOverlay={false}
                        linkToItem={true}
                    />
                </>
            );
        }
        if (objective.type === 'shoot') {
            let verb = t('Kill');
            if (objective.shotType !== 'kill') {
                verb = t('Shoot');
            }
            taskDetails = (
                <>
                    <>
                        {t('{{shootOrKill}} {{target}} {{count}} times', {
                            shootOrKill: verb,
                            target: objective.target,
                            count: objective.count,
                        })}
                    </>
                    {objective.distance && (
                        <div>
                            {t('From distance: {{operator}} {{count}} meters', {
                                operator: objective.distance.compareMethod,
                                count: objective.distance.value,
                            })}
                        </div>
                    )}
                    {objective.zoneNames?.length > 0 && (
                        <div>
                            {t('While inside: {{zoneList, list}}', {
                                zoneList: objective.zoneNames,
                            })}
                        </div>
                    )}
                    {objective.bodyParts?.length > 0 && (
                        <div>
                            {t('Hitting: {{bodyPartList, list}}', {
                                bodyPartList: objective.bodyParts,
                            })}
                        </div>
                    )}
                    {objective.usingWeapon?.length > 0 && (
                        <div>
                            {t('Using weapon:')}{' '}
                            <ul className="quest-item-list">
                                {objective.usingWeapon.map((weap) => {
                                    let item = items.find((i) => i.id === weap.id,);
                                    if (!item)
                                        return null;
                                    if (item.properties?.defaultPreset) {
                                        const preset = items.find(i => i.id === item.properties.defaultPreset.id);
                                        item = {
                                            ...item,
                                            baseImageLink: preset.baseImageLink,
                                            width: preset.width,
                                            height: preset.height,
                                        };
                                    }
                                    return (
                                        <li
                                            key={`weapon-${item.id}`}
                                            className={'quest-list-item'}
                                        >
                                            <ItemImage
                                                item={item}
                                                imageField="baseImageLink"
                                                nonFunctionalOverlay={false}
                                                linkToItem={true}
                                            />
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                    {objective.usingWeaponMods?.length > 0 && (
                        <div>
                            {t('Using weapon mods:')}{' '}
                            {objective.usingWeaponMods.map((modSet, index) => {
                                return (
                                    <ul key={`modset-${index}`} className="quest-item-list">
                                        {modSet.map((mod) => {
                                            const item = items.find((i) => i.id === mod.id);
                                            if (!item)
                                                return null;
                                            return (
                                                <li
                                                    key={`mod-${item.id}`}
                                                    className={'quest-list-item'}
                                                >
                                                    <ItemImage
                                                        item={item}
                                                        imageField="baseImageLink"
                                                        nonFunctionalOverlay={false}
                                                        linkToItem={true}
                                                    />
                                                </li>
                                            );
                                        })}
                                    </ul>
                                );
                            })}
                        </div>
                    )}
                    {objective.wearing?.length > 0 && (
                        <div>
                            {t('While wearing:')}{' '}
                            {objective.wearing.map((outfit, index) => {
                                return (
                                    <ul key={`outfit-${index}`} className="quest-item-list">
                                        {outfit.map((accessory) => {
                                            const item = items.find((i) => i.id === accessory.id);
                                            if (!item)
                                                return null;
                                            return (
                                                <li
                                                    key={`accessory-${item.id}`}
                                                    className={'quest-list-item'}
                                                >
                                                    <ItemImage
                                                        item={item}
                                                        imageField="baseImageLink"
                                                        nonFunctionalOverlay={false}
                                                        linkToItem={true}
                                                    />
                                                </li>
                                            );
                                        })}
                                    </ul>
                                );
                            })}
                        </div>
                    )}
                    {objective.notWearing?.length > 0 && (
                        <div>
                            {t('Not wearing:')}{' '}
                            <ul className="quest-item-list">
                                {objective.notWearing.map((accessory) => {
                                    const item = items.find((i) => i.id === accessory.id);
                                    if (!item)
                                        return null;
                                    return (
                                        <li
                                            key={`accessory-${item.id}`}
                                            className={'quest-list-item'}
                                        >
                                            <ItemImage
                                                item={item}
                                                imageField="baseImageLink"
                                                nonFunctionalOverlay={false}
                                                linkToItem={true}
                                            />
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                    {objective.playerHealthEffect && (
                        <div>
                            {objective.playerHealthEffect.time ?
                                t('While having the {{effectNames, list}} effect(s) on your {{bodyParts, list}} for {{operator}} {{count}} seconds', {
                                    effectNames: objective.playerHealthEffect.effects,
                                    bodyParts: objective.playerHealthEffect.bodyParts,
                                    operator: objective.playerHealthEffect.time?.compareMethod,
                                    count: objective.playerHealthEffect.time?.value,
                                })
                            :
                                t('While having the {{effectNames, list}} effect(s) on your {{bodyParts, list}}', {
                                    effectNames: objective.playerHealthEffect.effects,
                                    bodyParts: objective.playerHealthEffect.bodyParts,
                                })
                            }
                        </div>
                    )}
                    {objective.enemyHealthEffect && (
                        <div>
                            {objective.enemyHealthEffect.time ?
                                t('While target has the {{effectNames, list}} effect(s) on their {{bodyParts, list}} for {{operator}} {{count}} seconds', {
                                    effectNames: objective.enemyHealthEffect.effects,
                                    bodyParts: objective.enemyHealthEffect.bodyParts,
                                    operator: objective.enemyHealthEffect.time?.compareMethod,
                                    count: objective.enemyHealthEffect.time?.value,
                                })
                            :
                                t('While target has the {{effectNames, list}} effect(s) on their {{bodyParts, list}}', {
                                    effectNames: objective.enemyHealthEffect.effects,
                                    bodyParts: objective.enemyHealthEffect.bodyParts,
                                })
                            }
                        </div>
                    )}
                </>
            );
        }
        if (objective.type === 'skill') {
            taskDetails = (
                <>
                    {t('Obtain level {{level}} {{skillName}} skill', {
                        level: objective.skillLevel.level,
                        skillName: objective.skillLevel.name,
                    })}
                </>
            );
        }
        if (objective.type === 'taskStatus') {
            const task = quests.find((q) => q.id === objective.task.id);
            if (!task)
                return null;
            taskDetails = (
                <>
                    <Link to={`/task/${task.normalizedName}`}>{task.name}</Link>
                    <span>
                        :{' '}
                        {objective.status
                            .map((status) => {
                                return t(status);
                            })
                            .join(', ')}
                    </span>
                </>
            );
        }
        if (objective.type === 'traderLevel') {
            const trader = traders.find((t) => t.id === objective.trader.id);
            taskDetails = (
                <>
                    <Link to={`/trader/${trader.normalizedName}`}>
                        {trader.name}
                    </Link>
                    <span>{` ${t('LL{{level}}', { level: objective.level })}`}</span>
                </>
            );
        }
        if (objective.type === 'traderStanding') {
            const trader = traders.find((t) => t.id === objective.trader.id);
            taskDetails = (
                <>
                    <Link to={`/trader/${trader.normalizedName}`}>
                        {trader.name}
                    </Link>
                    <span>{` ${t('{{compareMethod}} {{reputation}} reputation', { reputation: objective.value, compareMethod: objective.compareMethod })}`}</span>
                </>
            );
        }
        if (objective.type === 'useItem') {
            let zones = <></>;
            if (objective.zoneNames.length > 0) {
                zones = (
                    <div>{t('In area(s): {{areaList}}', {areaList: objective.zoneNames.join(', ')})}</div>
                );
            }
            taskDetails = (
                <div>
                    {t('Use any of:')}{' '}
                    <ul className="quest-item-list">
                        {objective.useAny.map((useItem, index) => {
                            const item = items.find((i) => i.id === useItem.id);
                            if (!item)
                                return null;
                            return (
                                <li
                                    key={`item-${index}-${item.id}`}
                                >
                                    <ItemImage
                                        item={item}
                                        imageField="baseImageLink"
                                        nonFunctionalOverlay={false}
                                        linkToItem={true}
                                    />
                                </li>
                            );
                        })}
                    </ul>
                    {zones}
                </div>
            );
        }
        let objectiveDescription = null;
        if (objective.description) {
            objectiveDescription = <h3>{`✔️ ${objective.description} ${objective.optional ? `(${t('optional')})` : ''}`}</h3>;
        }
        return (
            <div key={objective.id}>
                {objectiveDescription}
                {objective.maps.length > 0 && (
                    <div key="objective-maps">
                        {`${t('Maps')}: ${objective.maps
                            .map((m) => m.name)
                            .join(', ')}`}
                    </div>
                )}
                {taskDetails}
            </div>
        );
    };

    return [
        <SEO 
            title={`${currentQuest.name} - ${t('Escape from Tarkov')} - ${t('Tarkov.dev')}`}
            description={t('task-page-description', 'This page includes information on the objectives, rewards, and strategies for completing task {{questName}}. Get tips on how to prepare for and succeed in your mission.', { questName: currentQuest.name })}
            url={`https://tarkov.dev/task/${currentQuest.normalizedName}`}
            key="seo-wrapper"
        />,
        <div className="display-wrapper" key={'display-wrapper'}>
            <div className={'quest-page-wrapper'}>
                <TaskSearch showDropdown />
                <div className="quest-information-grid">
                    <div className="quest-information-wrapper">
                        <h1>
                            <div className={'quest-font'}>
                                {!currentQuest.loading
                                    ? (currentQuest.name)
                                    : (<LoadingSmall />)
                                }
                                {currentQuest.factionName === 'Any' ? '' : ` (${currentQuest.factionName})`}
                            </div>
                            <img
                                alt={currentQuest.trader.name}
                                className={'quest-icon'}
                                loading="lazy"
                                src={`${process.env.PUBLIC_URL}/images/traders/${currentQuest.trader.normalizedName}-icon.jpg`}
                            />
                        </h1>
                        {currentQuest.wikiLink && (
                            <div className="wiki-link-wrapper">
                                <a href={currentQuest.wikiLink} target="_blank" rel="noopener noreferrer">{t('Wiki')}</a>
                            </div>
                        )}
                        {false && typeof currentQuest.tarkovDataId !== 'undefined' && (
                            <div className="wiki-link-wrapper">
                                <a href={`https://tarkovtracker.io/quest/${currentQuest.tarkovDataId}`} target="_blank" rel="noopener noreferrer">{t('TarkovTracker')}</a>
                            </div>
                        )}
                    </div>
                    <div className={`quest-icon-and-link-wrapper`}>
                        <Link to={`/trader/${currentQuest.trader.normalizedName}`}>
                            <img
                                alt={currentQuest.trader.name}
                                height="86"
                                width="86"
                                loading="lazy"
                                src={`${process.env.PUBLIC_URL}/images/traders/${currentQuest.trader.normalizedName}-portrait.png`}
                                // title = {`Sell ${currentItemData.name} on the Flea market`}
                            />
                        </Link>
                    </div>
                </div>
                {requirementsChunk}
                {nextQuests.length > 0 && (
                    <div>
                        <h2>➡️📋 {t('Leads to')}</h2>
                        {nextQuests.map((task) => {
                            let failNote = '';
                            let status = task.taskRequirements.find(
                                (req) => req.task.id === currentQuest.id,
                            ).status;
                            if (status.length === 1 && status[0] === 'failed') {
                                failNote = t('(on failure)');
                            }
                            return (
                                <div key={`req-task-${task.id}`}>
                                    <Link to={`/task/${task.normalizedName}`}>{task.name}</Link>{' '}
                                    {failNote}
                                </div>
                            );
                        })}
                    </div>
                )}
                {/* Divider between sections */}
                <hr className="hr-muted-full"></hr>

                <h2 className="center-title task-details-heading">{t('Task Details')}</h2>

                {currentQuest.map && <h2>{`🗺️ ${t('Map')}: ${currentQuest.map.name}`}</h2>}

                {/* loop through all the values in mapJson array and if there is a match, add a link to the map */}
                {currentQuest.map &&
                    Object.values(mapImages).reduce((foundMap, map) => {
                        if (foundMap) {
                            return foundMap;
                        }
                        if (map.normalizedName === currentQuest.map.normalizedName) {
                            foundMap = (
                                <div key={`map-link-${map.normalizedName}`}>
                                    <Link to={map.primaryPath}>
                                        {t('View Map')} - {map.name}
                                    </Link>
                                </div>
                            );
                        }
                        return foundMap;
                    }, null)}

                <h2>🏆 {t('Objectives')}</h2>
                <div key="task-objectives">
                    {currentQuest.objectives.map((objective) => {
                        return getObjective(objective);
                    })}
                </div>
                {currentQuest.failConditions?.length > 0 && (
                    <div>
                        <h2>❌ {t('Fail On')}</h2>
                        <div key="task-fail-conditions">
                            {currentQuest.failConditions.map((objective) => {
                                return getObjective(objective);
                            })}
                        </div>
                    </div>
                )}
                {currentQuest.neededKeys?.length > 0 && (
                    <div key="task-keys">
                        <h2>🗝️ {t('Needed Keys')}</h2>
                        <ul>
                            {currentQuest.neededKeys.map((mapKeys, mapIndex) => {
                                const map = maps.find((m) => m.id === mapKeys.map.id);
                                return (
                                    <li key={`${map.id}-${mapIndex}`} className="quest-list-item">
                                        {`${map.name}: `}
                                        {mapKeys.keys
                                            .map((key) => {
                                                const item = items.find((i) => i.id === key.id);
                                                if (!item)
                                                    return null;
                                                return (
                                                    <Link
                                                        key={item.id}
                                                        to={`/item/${item.normalizedName}`}
                                                    >
                                                        {item.name}
                                                    </Link>
                                                );
                                            })
                                            .reduce((elements, current) => {
                                                if (elements.length > 0) {
                                                    elements.push(<span> or </span>);
                                                }
                                                elements.push(current);
                                                return elements;
                                            }, [])}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                <hr className="hr-muted-full"></hr>

                <h2 className="center-title task-details-heading">{t('Task Completion')}</h2>

                <h2>🎁 {t('Rewards')}</h2>
                {currentQuest.finishRewards?.items?.length > 0 && (
                    <div key="finishRewards">
                        <h3>{t('Items')}</h3>
                        <ul className="quest-item-list">
                            {currentQuest.finishRewards?.items.map((rewardItem, index) => {
                                const item = items.find((it) => it.id === rewardItem.item.id);
                                if (!item)
                                    return null;
                                return (
                                    <li
                                        key={`reward-index-${rewardItem.item.id}-${index}`}
                                    >
                                        <ItemImage
                                            key={`reward-index-${rewardItem.item.id}-${index}`}
                                            item={item}
                                            imageField="baseImageLink"
                                            nonFunctionalOverlay={false}
                                            linkToItem={true}
                                            count={rewardItem.count}
                                            isFIR={true}
                                        />
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
                {currentQuest.finishRewards?.traderStanding?.length > 0 && (
                    <>
                        <h3>{t('Trader Standing')}</h3>
                        <ul>
                            {currentQuest.finishRewards.traderStanding.map((standing) => {
                                const trader = traders.find((t) => t.id === standing.trader.id);
                                let sign = '';
                                if (standing.standing > 0) {
                                    sign = '+';
                                }
                                return (
                                    <li className="quest-list-item" key={standing.trader.id}>
                                        <Link to={`/trader/${trader.normalizedName}`}>
                                            {trader.name}
                                        </Link>
                                        <span>
                                            {' '}
                                            {sign}
                                            {standing.standing}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </>
                )}
                {currentQuest.finishRewards?.skillLevelReward?.length > 0 && (
                    <>
                        <h3>{t('Skill Level')}</h3>
                        <ul>
                            {currentQuest.finishRewards.skillLevelReward.map((skillReward) => {
                                return (
                                    <li className="quest-list-item" key={skillReward.name}>
                                        {`${skillReward.name} +${skillReward.level}`};
                                    </li>
                                )
                            })}
                        </ul>
                    </>
                )}
                {currentQuest.finishRewards?.offerUnlock?.length > 0 && (
                    <>
                        <h3>{t('Trader Offer Unlock')}</h3>
                        <ul>
                            {currentQuest.finishRewards.offerUnlock.map((unlock, index) => {
                                const trader = traders.find((t) => t.id === unlock.trader.id);
                                const item = items.find((i) => i.id === unlock.item.id);
                                if (!item)
                                    return null;
                                return (
                                    <li className="quest-list-item" key={`${unlock.item.id}-${index}`}>
                                        <Link to={`/item/${item.normalizedName}`}>{item.name}</Link>
                                        <span>{' @ '}</span>
                                        <Link to={`/trader/${trader.normalizedName}`}>
                                            {trader.name}
                                        </Link>
                                        <span>{` ${t('LL{{level}}', { level: unlock.level })}`}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </>
                )}
                {currentQuest.finishRewards?.traderUnlock?.length > 0 && (
                    <>
                        <h3>{t('Trader Unlock')}</h3>
                        <ul>
                            {currentQuest.finishRewards.traderUnlock.map((unlock) => {
                                const trader = traders.find((t) => t.id === unlock.id);
                                return (
                                    <li className="quest-list-item" key={unlock.id}>
                                        <Link to={`/trader/${trader.normalizedName}`}>
                                            {trader.name}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </>
                )}
            </div>
        </div>,
    ];
}

export default Quest;
