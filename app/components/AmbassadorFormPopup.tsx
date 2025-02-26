import React, { useState, useEffect, Fragment } from 'react';
import styles from './AmbassadorFormPopup.module.css';
import PropTypes from 'prop-types';

interface AmbassadorFormPopupProps {
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  uid: string;
}

interface SocialHandles {
  [key: string]: string;
}

interface SocialAudiences {
  [key: string]: string;
}

type Section = 'niches' | 'audience' | 'socials' | 'languages' | 'main_ecosystem';

interface CustomExplanations {
  niches: { [key: string]: string };
  audience: { [key: string]: string };
}

const AmbassadorFormPopup = ({ onClose, onSubmit, uid }: AmbassadorFormPopupProps) => {
  // Reuse all the state from the original component
  const [currentStep, setCurrentStep] = useState(1);
  const [customNiches, setCustomNiches] = useState<string[]>([]);
  const [customAudienceTypes, setCustomAudienceTypes] = useState<string[]>([]);
  const [customSocials, setCustomSocials] = useState<string[]>([]);
  const [customLanguages, setCustomLanguages] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [customSystems, setCustomSystems] = useState<string[]>([]);
  const [selectedSystems, setSelectedSystems] = useState<string[]>([]);
  const [newCustomField, setNewCustomField] = useState('');
  const [activeSection, setActiveSection] = useState<Section | ''>('');
  const [socialHandles, setSocialHandles] = useState<SocialHandles>({
    twitter: '',
    youtube: '',
    discord: '',
    instagram: '',
    twitch: ''
  });
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
  const [selectedSocials, setSelectedSocials] = useState<string[]>([]);
  const [customExplanations, setCustomExplanations] = useState<CustomExplanations>({
    niches: {},
    audience: {}
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isExistingAmbassador, setIsExistingAmbassador] = useState(false);
  const [socialAudiences, setSocialAudiences] = useState<SocialAudiences>({
    twitter: '',
    youtube: '',
    discord: '',
    instagram: '',
    twitch: ''
  });
  const [description, setDescription] = useState('');

  // Prevent body scrolling when popup is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Constants remain the same
  const defaultLanguages = [
    "English", "French", "Spanish", "German", "Chinese", 
    "Japanese", "Korean", "Russian", "Arabic", "Portuguese"
  ];

  const defaultSystems = [
    "Bitcoin", "Ethereum", "Avax", "Solana", "Abstract",
    "Aptos", "Hbar", "Ordinals"
  ];

  const defaultNiches = [
    "Gaming/Metaverse/GameFi", "AI", "RWA", "DePin", "DeFi",
    "Infrastructure", "L1/L2/L3", "Data", "IP"
  ];

  const defaultAudienceTypes = [
    "Traders", "Holders", "Whales", "Founders", "Degen"
  ];

  const defaultSocials = [
    { id: 'twitter', name: 'Twitter', placeholder: '@username', audiencePlaceholder: 'Number of followers' },
    { id: 'youtube', name: 'YouTube', placeholder: 'Channel URL', audiencePlaceholder: 'Number of subscribers' },
    { id: 'discord', name: 'Discord', placeholder: 'Server invite or username#0000', audiencePlaceholder: 'Number of members' },
    { id: 'instagram', name: 'Instagram', placeholder: '@username', audiencePlaceholder: 'Number of followers' },
    { id: 'twitch', name: 'Twitch', placeholder: 'Channel name', audiencePlaceholder: 'Number of followers' }
  ];

  // Handlers remain the same
  const handleSocialChange = (socialId: string, value: string) => {
    setSocialHandles(prev => ({
      ...prev,
      [socialId]: value
    }));
  };

  const handleSocialAudienceChange = (socialId: string, value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setSocialAudiences(prev => ({
      ...prev,
      [socialId]: numericValue
    }));
  };

  const handleAddCustomField = (section: Section) => {
    if (!newCustomField.trim()) return;
    
    switch(section) {
      case 'niches':
        setCustomNiches([...customNiches, newCustomField]);
        setSelectedNiches([...selectedNiches, newCustomField]);
        break;
      case 'audience':
        setCustomAudienceTypes([...customAudienceTypes, newCustomField]);
        setSelectedAudiences([...selectedAudiences, newCustomField]);
        break;
      case 'socials':
        setCustomSocials([...customSocials, newCustomField]);
        setSelectedSocials([...selectedSocials, newCustomField]);
        setSocialHandles(prev => ({
          ...prev,
          [newCustomField]: ''
        }));
        break;
      case 'languages':
        setCustomLanguages([...customLanguages, newCustomField]);
        setSelectedLanguages([...selectedLanguages, newCustomField]);
        break;
      case 'main_ecosystem':
        setCustomSystems([...customSystems, newCustomField]);
        setSelectedSystems([...selectedSystems, newCustomField]);
        break;
    }
    setNewCustomField('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, section: Section) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomField(section);
    }
  };

  const handleDeleteCustom = (section: Section, value: string) => {
    switch(section) {
      case 'niches':
        setCustomNiches(customNiches.filter(niche => niche !== value));
        setSelectedNiches(selectedNiches.filter(niche => niche !== value));
        setCustomExplanations(prev => {
          const { [value]: removed, ...rest } = prev.niches;
          return { ...prev, niches: rest };
        });
        break;
      case 'audience':
        setCustomAudienceTypes(customAudienceTypes.filter(type => type !== value));
        setSelectedAudiences(selectedAudiences.filter(type => type !== value));
        setCustomExplanations(prev => {
          const { [value]: removed, ...rest } = prev.audience;
          return { ...prev, audience: rest };
        });
        break;
      case 'socials':
        setCustomSocials(customSocials.filter(social => social !== value));
        setSelectedSocials(selectedSocials.filter(social => social !== value));
        break;
      case 'languages':
        setCustomLanguages(prev => prev.filter(lang => lang !== value));
        setSelectedLanguages(prev => prev.filter(lang => lang !== value));
        break;
      case 'main_ecosystem':
        setCustomSystems(prev => prev.filter(sys => sys !== value));
        setSelectedSystems(prev => prev.filter(sys => sys !== value));
        break;
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      // Create the payload with structured data in details
      const payload = {
        details: {
          languages: selectedLanguages.reduce((acc: { [key: string]: boolean }, lang) => {
            acc[lang] = true;
            return acc;
          }, {}),
          niches: selectedNiches.reduce((acc: { [key: string]: boolean | string }, niche) => {
            acc[niche] = defaultNiches.includes(niche) ? true : (customExplanations.niches[niche] || '');
            return acc;
          }, {}),
          audience_type: selectedAudiences.reduce((acc: { [key: string]: boolean | string }, type) => {
            acc[type] = defaultAudienceTypes.includes(type) ? true : (customExplanations.audience[type] || '');
            return acc;
          }, {}),
          main_ecosystem: selectedSystems.reduce((acc: { [key: string]: boolean }, sys) => {
            acc[sys] = true;
            return acc;
          }, {}),
          main_socials: selectedSocials.reduce((acc: { [key: string]: { handle: string, audience_count: string } }, socialId) => {
            if (socialHandles[socialId]) {
              acc[socialId] = {
                handle: socialHandles[socialId].trim(),
                audience_count: socialAudiences[socialId] || ''
              };
            }
            return acc;
          }, {}),
          description: description
        }
      };

      await onSubmit(payload);
      onClose();
    } catch (error) {
      console.error('Error saving ambassador data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Languages
        return (
          <div className={styles.section}>
            <h3>Content Languages</h3>
            <div className={styles.options_container}>
              <div className={styles.default_options}>
                {defaultLanguages.map((language, index) => (
                  <div 
                    key={index} 
                    className={`${styles.option} ${styles.default} ${selectedLanguages.includes(language) ? styles.selected : ''}`}
                    onClick={() => {
                      const newSelected = selectedLanguages.includes(language)
                        ? selectedLanguages.filter(l => l !== language)
                        : [...selectedLanguages, language];
                      setSelectedLanguages(newSelected);
                    }}
                  >
                    <label>{language}</label>
                  </div>
                ))}
              </div>
              <div className={styles.custom_options}>
                {customLanguages.map((language, index) => (
                  <div 
                    key={`custom-${index}`} 
                    className={`${styles.option} ${styles.custom} ${selectedLanguages.includes(language) ? styles.selected : ''}`}
                  >
                    <div
                      onClick={() => {
                        const newSelected = selectedLanguages.includes(language)
                          ? selectedLanguages.filter(l => l !== language)
                          : [...selectedLanguages, language];
                        setSelectedLanguages(newSelected);
                      }}
                    >
                      <label>{language}</label>
                    </div>
                    <span 
                      className={styles.delete_btn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustom('languages', language);
                      }}
                    >
                      ×
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.add_custom_field}>
              <input
                type="text"
                placeholder="Add custom language"
                value={activeSection === 'languages' ? newCustomField : ''}
                onChange={(e) => {
                  setActiveSection('languages');
                  setNewCustomField(e.target.value);
                }}
                onKeyPress={(e) => handleKeyPress(e, 'languages')}
              />
              <button onClick={() => handleAddCustomField('languages')}>Add</button>
            </div>
          </div>
        );

      case 2: // Niches
        return (
          <div className={styles.section}>
            <h3>Niches</h3>
            <div className={styles.options_container}>
              <div className={styles.default_options}>
                {defaultNiches.map((niche, index) => (
                  <div 
                    key={index} 
                    className={`${styles.option} ${styles.default} ${selectedNiches.includes(niche) ? styles.selected : ''}`}
                    onClick={() => {
                      const newSelected = selectedNiches.includes(niche)
                        ? selectedNiches.filter(n => n !== niche)
                        : [...selectedNiches, niche];
                      setSelectedNiches(newSelected);
                    }}
                  >
                    <label>{niche}</label>
                  </div>
                ))}
              </div>
              <div className={styles.custom_options}>
                {customNiches.map((niche, index) => (
                  <div 
                    key={`custom-${index}`} 
                    className={`${styles.option} ${styles.custom} ${selectedNiches.includes(niche) ? styles.selected : ''}`}
                    title={customExplanations.niches[niche] || ''}
                  >
                    <div
                      onClick={() => {
                        const newSelected = selectedNiches.includes(niche)
                          ? selectedNiches.filter(n => n !== niche)
                          : [...selectedNiches, niche];
                        setSelectedNiches(newSelected);
                      }}
                    >
                      <label>{niche}</label>
                    </div>
                    <span 
                      className={styles.delete_btn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustom('niches', niche);
                      }}
                    >
                      ×
                    </span>
                    {customExplanations.niches[niche] && (
                      <div className={styles.tooltip}>{customExplanations.niches[niche]}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.add_custom_field}>
              <div className={styles.input_group}>
                <input
                  type="text"
                  placeholder="Add custom niche"
                  value={activeSection === 'niches' ? newCustomField : ''}
                  onChange={(e) => {
                    setActiveSection('niches');
                    setNewCustomField(e.target.value);
                  }}
                  onKeyPress={(e) => handleKeyPress(e, 'niches')}
                />
                <textarea
                  placeholder="Explain briefly your custom niche (optional)"
                  value={customExplanations.niches[newCustomField] || ''}
                  onChange={(e) => setCustomExplanations(prev => ({
                    ...prev,
                    niches: {
                      ...prev.niches,
                      [newCustomField]: e.target.value
                    }
                  }))}
                  className={styles.explanation_field}
                />
              </div>
              <button onClick={() => handleAddCustomField('niches')}>Add</button>
            </div>
          </div>
        );

      case 3: // Main Ecosystems
        return (
          <div className={styles.section}>
            <h3>Main ecosystems</h3>
            <div className={styles.options_container}>
              <div className={styles.default_options}>
                {defaultSystems.map((system, index) => (
                  <div 
                    key={index} 
                    className={`${styles.option} ${styles.default} ${selectedSystems.includes(system) ? styles.selected : ''}`}
                    onClick={() => {
                      const newSelected = selectedSystems.includes(system)
                        ? selectedSystems.filter(s => s !== system)
                        : [...selectedSystems, system];
                      setSelectedSystems(newSelected);
                    }}
                  >
                    <label>{system}</label>
                  </div>
                ))}
              </div>
              <div className={styles.custom_options}>
                {customSystems.map((system, index) => (
                  <div 
                    key={`custom-${index}`} 
                    className={`${styles.option} ${styles.custom} ${selectedSystems.includes(system) ? styles.selected : ''}`}
                  >
                    <div
                      onClick={() => {
                        const newSelected = selectedSystems.includes(system)
                          ? selectedSystems.filter(s => s !== system)
                          : [...selectedSystems, system];
                        setSelectedSystems(newSelected);
                      }}
                    >
                      <label>{system}</label>
                    </div>
                    <span 
                      className={styles.delete_btn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustom('main_ecosystem', system);
                      }}
                    >
                      ×
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.add_custom_field}>
              <input
                type="text"
                placeholder="Type other ecosystems"
                value={activeSection === 'main_ecosystem' ? newCustomField : ''}
                onChange={(e) => {
                  setActiveSection('main_ecosystem');
                  setNewCustomField(e.target.value);
                }}
                onKeyPress={(e) => handleKeyPress(e, 'main_ecosystem')}
              />
              <button onClick={() => handleAddCustomField('main_ecosystem')}>Add</button>
            </div>
          </div>
        );

      case 4: // Audience Types
        return (
          <div className={styles.section}>
            <h3>Audience Type</h3>
            <div className={styles.options_container}>
              <div className={styles.default_options}>
                {defaultAudienceTypes.map((type, index) => (
                  <div 
                    key={index} 
                    className={`${styles.option} ${styles.default} ${selectedAudiences.includes(type) ? styles.selected : ''}`}
                    onClick={() => {
                      const newSelected = selectedAudiences.includes(type)
                        ? selectedAudiences.filter(t => t !== type)
                        : [...selectedAudiences, type];
                      setSelectedAudiences(newSelected);
                    }}
                  >
                    <label>{type}</label>
                  </div>
                ))}
              </div>
              <div className={styles.custom_options}>
                {customAudienceTypes.map((type, index) => (
                  <div 
                    key={`custom-${index}`} 
                    className={`${styles.option} ${styles.custom} ${selectedAudiences.includes(type) ? styles.selected : ''}`}
                    title={customExplanations.audience[type] || ''}
                  >
                    <div
                      onClick={() => {
                        const newSelected = selectedAudiences.includes(type)
                          ? selectedAudiences.filter(t => t !== type)
                          : [...selectedAudiences, type];
                        setSelectedAudiences(newSelected);
                      }}
                    >
                      <label>{type}</label>
                    </div>
                    <span 
                      className={styles.delete_btn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustom('audience', type);
                      }}
                    >
                      ×
                    </span>
                    {customExplanations.audience[type] && (
                      <div className={styles.tooltip}>{customExplanations.audience[type]}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.add_custom_field}>
              <div className={styles.input_group}>
                <input
                  type="text"
                  placeholder="Add custom audience type"
                  value={activeSection === 'audience' ? newCustomField : ''}
                  onChange={(e) => {
                    setActiveSection('audience');
                    setNewCustomField(e.target.value);
                  }}
                  onKeyPress={(e) => handleKeyPress(e, 'audience')}
                />
                <textarea
                  placeholder="Explain briefly your custom audience type (optional)"
                  value={customExplanations.audience[newCustomField] || ''}
                  onChange={(e) => setCustomExplanations(prev => ({
                    ...prev,
                    audience: {
                      ...prev.audience,
                      [newCustomField]: e.target.value
                    }
                  }))}
                  className={styles.explanation_field}
                />
              </div>
              <button onClick={() => handleAddCustomField('audience')}>Add</button>
            </div>
          </div>
        );

      case 5: // Social Media
        return (
          <div className={`${styles.section} ${styles.socials_section}`}>
            <h3>Main Socials</h3>
            <div className={styles.socials_container}>
              {defaultSocials.map((social) => (
                <div 
                  key={social.id} 
                  className={`${styles.social_input_group} ${selectedSocials.includes(social.id) ? styles.selected : ''}`}
                >
                  <div 
                    className={styles.social_label}
                    onClick={() => {
                      const newSelected = selectedSocials.includes(social.id)
                        ? selectedSocials.filter(s => s !== social.id)
                        : [...selectedSocials, social.id];
                      setSelectedSocials(newSelected);
                    }}
                  >
                    <label>{social.name}</label>
                  </div>
                  <div className={styles.social_inputs}>
                    <input
                      type="text"
                      placeholder={social.placeholder}
                      value={socialHandles[social.id] || ''}
                      onChange={(e) => handleSocialChange(social.id, e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder={social.audiencePlaceholder}
                      value={socialAudiences[social.id] || ''}
                      onChange={(e) => handleSocialAudienceChange(social.id, e.target.value)}
                      className={styles.audience_input}
                    />
                  </div>
                </div>
              ))}
              {customSocials.map((socialId) => (
                <div 
                  key={socialId} 
                  className={`${styles.social_input_group} ${styles.custom} ${selectedSocials.includes(socialId) ? styles.selected : ''}`}
                >
                  <div 
                    className={styles.social_label}
                    onClick={() => {
                      const newSelected = selectedSocials.includes(socialId)
                        ? selectedSocials.filter(s => s !== socialId)
                        : [...selectedSocials, socialId];
                      setSelectedSocials(newSelected);
                    }}
                  >
                    <label>{socialId}</label>
                    <span 
                      className={styles.delete_btn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCustom('socials', socialId);
                      }}
                    >
                      ×
                    </span>
                  </div>
                  <div className={styles.social_inputs}>
                    <input
                      type="text"
                      placeholder="Social media handle/URL"
                      value={socialHandles[socialId] || ''}
                      onChange={(e) => handleSocialChange(socialId, e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Number of followers/subscribers"
                      value={socialAudiences[socialId] || ''}
                      onChange={(e) => handleSocialAudienceChange(socialId, e.target.value)}
                      className={styles.audience_input}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.add_custom_field}>
              <input
                type="text"
                placeholder="Add custom social platform"
                value={activeSection === 'socials' ? newCustomField : ''}
                onChange={(e) => {
                  setActiveSection('socials');
                  setNewCustomField(e.target.value);
                }}
                onKeyPress={(e) => handleKeyPress(e, 'socials')}
              />
              <button onClick={() => handleAddCustomField('socials')}>Add</button>
            </div>
          </div>
        );

      case 6: // Ambassador Journey
        return (
          <div className={`${styles.section} ${styles.contribution_section}`}>
            <h3>Your Ambassador Journey</h3>
            <div className={styles.contribution_container}>
              <div className={styles.contribution_description}>
                <p className={styles.contribution_prompt}>
                  Tell us about your journey as an ambassador and how you contribute to projects. 
                  Share your unique approach and what makes you stand out.
                </p>
                <textarea
                  className={styles.contribution_textarea}
                  placeholder="Describe your ambassador contributions... (e.g., 'I specialize in community growth through engaging Twitter spaces and educational content creation. I've helped projects like X achieve Y% growth in Z months...')"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.popup_overlay} onClick={onClose}>
      <div className={styles.popup_content} onClick={e => e.stopPropagation()}>
        <button 
          className={styles.popup_close}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className={styles.step_indicator}>
          {Array.from({ length: 6 }, (_, i) => (
            <Fragment key={i}>
              <div className={`${styles.step} ${currentStep === i + 1 ? styles.active : ''}`}>
                {i + 1}
              </div>
              {i < 5 && <div className={styles.step_line} />}
            </Fragment>
          ))}
        </div>

        <div className={styles.popup_body}>
          <h2 className={styles.popup_title}>Ambassador Application</h2>
          
          {renderStepContent()}

          <div className={styles.button_group}>
            {currentStep > 1 && (
              <button 
                className={styles.back_button}
                onClick={() => setCurrentStep(prev => prev - 1)}
              >
                Back
              </button>
            )}
            {currentStep < 6 ? (
              <button 
                className={styles.next_button}
                onClick={() => setCurrentStep(prev => prev + 1)}
              >
                Next
              </button>
            ) : (
              <button 
                className={styles.save_button}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

AmbassadorFormPopup.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  uid: PropTypes.string.isRequired,
};

export default AmbassadorFormPopup; 