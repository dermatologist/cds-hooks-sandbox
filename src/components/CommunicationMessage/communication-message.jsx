import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Field from 'terra-form-field';
import Button from 'terra-button';
import styles from './communication-message.css';

const propTypes = {
  /**
   * The current communication message value
   */
  value: PropTypes.string,
  /**
   * Callback when message changes
   */
  onChange: PropTypes.func.isRequired,
  /**
   * Help text to display under the field
   */
  helpText: PropTypes.string,
};

const defaultProps = {
  value: '',
  helpText: 'This free-form note maps to CommunicationRequest.payload[0].contentString and auto-saves after 5s of inactivity.',
};

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

/**
 * Communication Message component with text and image upload support
 */
class CommunicationMessage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      /**
       * Text content of the message
       */
      text: '',
      /**
       * Selected image data (base64)
       */
      imageData: null,
      /**
       * Image preview URL
       */
      imagePreview: null,
      /**
       * File name of selected image
       */
      fileName: null,
      /**
       * Error message (if any)
       */
      error: null,
      /**
       * Drag over state for visual feedback
       */
      isDragOver: false,
    };

    this.fileInputRef = React.createRef();
    this.handleTextChange = this.handleTextChange.bind(this);
    this.handleFileSelect = this.handleFileSelect.bind(this);
    this.handleFileInputChange = this.handleFileInputChange.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleDragLeave = this.handleDragLeave.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.handleRemoveImage = this.handleRemoveImage.bind(this);
    this.openFileDialog = this.openFileDialog.bind(this);
  }

  /**
   * Parse incoming value to extract text and image
   */
  componentDidMount() {
    this.parseIncomingValue(this.props.value);
  }

  /**
   * Update state if props change externally
   */
  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value && this.props.value !== this.buildMessagePayload()) {
      this.parseIncomingValue(this.props.value);
    }
  }

  /**
   * Parse the incoming value to determine if it's JSON with image or plain text
   */
  parseIncomingValue(value) {
    if (!value) {
      this.setState({
        text: '',
        imageData: null,
        imagePreview: null,
        fileName: null,
      });
      return;
    }

    try {
      const parsed = JSON.parse(value);
      if (parsed.image_url && typeof parsed.image_url === 'string') {
        this.setState({
          text: parsed.text || '',
          imageData: parsed.image_url,
          imagePreview: parsed.image_url,
          fileName: 'image',
        });
        return;
      }
    } catch (e) {
      // Not JSON, treat as plain text
    }

    // Plain text message
    this.setState({
      text: value,
      imageData: null,
      imagePreview: null,
      fileName: null,
    });
  }

  /**
   * Build the message payload to send
   * Returns stringified JSON if image exists, otherwise plain text
   */
  buildMessagePayload() {
    const { text, imageData } = this.state;

    if (imageData) {
      const payload = {
        image_url: imageData,
        text: text || '',
      };
      return JSON.stringify(payload);
    }

    return text;
  }

  /**
   * Handle text input change
   */
  handleTextChange(event) {
    const text = event.target.value;
    this.setState({ text, error: null }, () => {
      this.props.onChange({ target: { value: this.buildMessagePayload() } });
    });
  }

  /**
   * Validate and process selected file
   */
  handleFileSelect(file) {
    // Clear any existing error
    this.setState({ error: null });

    // Validate file type
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      this.setState({
        error: `Unsupported file type: ${file.type}. Please select a PNG, JPEG, GIF, or WebP image.`,
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      this.setState({
        error: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of 5MB.`,
      });
      return;
    }

    // Read and convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target.result;
      this.setState({
        imageData: base64Data,
        imagePreview: base64Data,
        fileName: file.name,
        error: null,
      }, () => {
        this.props.onChange({ target: { value: this.buildMessagePayload() } });
      });
    };
    reader.onerror = () => {
      this.setState({
        error: 'Failed to read file. Please try again.',
      });
    };
    reader.readAsDataURL(file);
  }

  /**
   * Handle file input change
   */
  handleFileInputChange(event) {
    const file = event.target.files[0];
    if (file) {
      this.handleFileSelect(file);
    }
  }

  /**
   * Handle drag over event
   */
  handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    this.setState({ isDragOver: true });
  }

  /**
   * Handle drag leave event
   */
  handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    this.setState({ isDragOver: false });
  }

  /**
   * Handle drop event
   */
  handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    this.setState({ isDragOver: false });

    const file = event.dataTransfer.files[0];
    if (file) {
      this.handleFileSelect(file);
    }
  }

  /**
   * Remove selected image
   */
  handleRemoveImage() {
    this.setState({
      imageData: null,
      imagePreview: null,
      fileName: null,
      error: null,
    }, () => {
      this.props.onChange({ target: { value: this.buildMessagePayload() } });
    });

    // Clear file input
    if (this.fileInputRef.current) {
      this.fileInputRef.current.value = '';
    }
  }

  /**
   * Open file dialog programmatically
   */
  openFileDialog() {
    if (this.fileInputRef.current) {
      this.fileInputRef.current.click();
    }
  }

  render() {
    const {
      text, imagePreview, fileName, error, isDragOver,
    } = this.state;

    return (
      <Field
        label="Communication message"
        help={this.props.helpText}
        isInvalid={!!error}
        error={error}
      >
        <div className={styles.container}>
          {/* Image upload area */}
          <div
            className={`${styles['drop-zone']} ${isDragOver ? styles['drag-over'] : ''}`}
            onDragOver={this.handleDragOver}
            onDragLeave={this.handleDragLeave}
            onDrop={this.handleDrop}
          >
            {!imagePreview && (
              <div className={styles['upload-prompt']}>
                <p>Drag and drop an image here or</p>
                <Button
                  text="Choose File"
                  variant="neutral"
                  onClick={this.openFileDialog}
                />
                <p className={styles['file-info']}>Supported: PNG, JPEG, GIF, WebP (Max 5MB)</p>
              </div>
            )}

            {imagePreview && (
              <div className={styles['image-preview']}>
                <img src={imagePreview} alt={fileName || 'Preview'} />
                <div className={styles['image-info']}>
                  <span>{fileName}</span>
                  <Button
                    text="Remove"
                    variant="de-emphasis"
                    onClick={this.handleRemoveImage}
                  />
                </div>
              </div>
            )}

            <input
              ref={this.fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              onChange={this.handleFileInputChange}
              className={styles['file-input']}
            />
          </div>

          {/* Text input */}
          <textarea
            name="communication-message"
            value={text}
            onChange={this.handleTextChange}
            rows={3}
            placeholder="Question (image above is optional)"
            className={styles.textarea}
          />
        </div>
      </Field>
    );
  }
}

CommunicationMessage.propTypes = propTypes;
CommunicationMessage.defaultProps = defaultProps;

export default CommunicationMessage;
