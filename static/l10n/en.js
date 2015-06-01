module.exports = {
  GLOBAL: {
    FOOTER: 'Powered by <a href="https://git.framasoft.org/framasoft/ep_mypads">MyPads</a><br>Published under Apache License 2.0',
    AND: 'and'
  },
  ACTIONS: {
    ACTIONS: 'Actions',
    HELP: 'Help',
    SAVE: 'Save',
    CANCEL: 'Cancel'
  },
  MENU: {
    PAD: 'My Pads',
    BOOKMARK: 'My Bookmarks',
    PROFILE: 'My Profile',
    ADMIN: 'Administration',
    LOGOUT: 'Logout'
  },
  ADMIN: {
    GLOBAL_SETTINGS: 'Global settings'
  },
  NOTIFICATION: {
    SUCCESS: 'Success',
    INFO: 'Info',
    ERROR: 'Erreur',
    ERROR_UNEXPECTED: 'An unexpected error has raised. Please contact the administrator.',
    WARNING: 'Warning'
  },
  TAG: {
    TAGS: 'Tags',
    PLACEHOLDER: 'Enter your tag',
    HELP: 'You can associate to this element as many tags as you wish'
  },
  USER: {
    FORM: 'Login',
    ORSUB: ' (or subscribe ?)',
    MANDATORY_FIELDS: 'Mandatory fields',
    OPTIONAL_FIELDS: 'Optional fields',
    MYPADS_ACCOUNT: 'MyPads account',
    SUBSCRIBE: 'Subscribe',
    PROFILE: 'Profile',
    USERNAME: 'Username',
    LOGIN: 'Login',
    PASSWORD: 'Password',
    PASSCHECK: 'Password Confirmation',
    PASSCURRENT: 'Current password',
    EMAIL: 'Email',
    EMAIL_SAMPLE: 'username@example.org',
    FIRSTNAME: 'Firstname',
    LASTNAME: 'Lastname',
    ORGANIZATION: 'Organization',
    UNDEF: '********',
    OK: 'Ok',
    REGISTER: 'Register',
    INFO: {
      LOGIN: 'The unique login you choose when you have subscribed',
      EMAIL: 'The email is required for password recovery and group invitation',
      PASSWORD_BEGIN: 'Must be between ',
      PASSWORD_END: ' characters',
      PASSWORD_CHECK: 'For verification : must be the same as password',
      PASSWORD_CURRENT: 'Security check : required for all profile changes',
      OPTIONAL: 'Optional field'
    },
    ERR: {
      LOGIN: 'Login is required',
      EMAIL: 'The email is required and shoule be valid',
      LOGOUT: 'Log out error : you wasn\'t authenticated.',
      PASSWORD_MISMATCH: 'The entered passwords do not match.'
    },
    AUTH: {
      SUCCESS: 'Successfull authentication ! Welcome.',
      SUCCESS_OUT: 'You have been successfully disconnected.',
      SUBSCRIBE_SUCCESS: 'Successfull subscription ! Welcome.',
      PROFILE_SUCCESS: 'Profile successfully updated.'
    },
    HELP: {
      PROFILE: '<p>Every change into your profile needs the current password field to be correctly filled. Please not that :</p><ul><li>you can change everything by updating the appropriate field;</li><li>leaving password and password confirmation empty won\'t affect your current password;</li><li>you can\'t change your login at the moment but you will in the future;</li><li>if you want to change your password, please enter the new one into the password field and confirm it with the password confirmation.</li></ul>'
    }
  },
  GROUP: {
    MYGROUPS: 'My Groups',
    GROUP: 'Group',
    GROUPS: 'Groups',
    BOOKMARKED: 'Bookmarked groups',
    ARCHIVED: 'Archived groups',
    ADD: 'Add a new group',
    ADD_HELP: '<h3>Visibility</h3><p>You have the choice between three levles of visibility. It will impact all linked pads :<ul><li><em>restricted</em>, default choice : access of the pads are limited to a list of invited users you have chosen;</li><li><em>private</em> : in this mode, you have to enter a password and access to the pads will be checked against this password;</li><li><em>public</em> : in this mode, all pads are public, users just need to have the URL address.</li></ul></p><h3>Readonly</h3><p>If you check <em>readonly</em>, all attached pads will stay in their state, and can not be edited. Note that visibility still works in readonly mode.</p><h3>Tags</h3><p>You can attach tags to this element by clicking on the corresponding input field and selecting them one by one.</p><p>To create a new tag, type it and type ENTER key or click on the \'Ok\' button. Once the tag has been added, it will automatically been selected on this form.</p><p>You can remove a tag by clicking on the cross located on the right.</p>',
    EDIT: 'Edit',
    EDIT_GROUP: 'Edit a group',
    VIEW: 'View',
    VIEW_HELP: '<p>The details of the group shows you :<ul><li>options defined when group has been created or updated;</li><li>list of pads created for this group;</li><li>and list of admins and users of the group.</li></ul></p><p>From there, you can : <ul><li>create new pads, edit them, remove or mark them;</li><li>share administration of your group with other users;</li><li>invite other users to view and edit pads of the group.</li></ul></p>',
    REMOVE: 'Remove',
    BOOKMARK: 'Bookmark',
    UNMARK: 'Unmark',
    MARK_SUCCESS: 'Marking successfully',
    SHARE_ADMIN: 'Share administration',
    INVITE_USER: 'Invite users',
    SEARCH: {
      TITLE: 'Search',
      TYPE: 'Type here',
      HELP: 'Search on common fields with at least 2 characters'
    },
    PROPERTIES: 'Properties',
    FIELD: {
      NAME: 'Name',
      VISIBILITY: 'Visibility',
      PRIVATE: 'Private',
      RESTRICTED: 'Restricted',
      PUBLIC: 'Public',
      READONLY: 'Readonly'
    },
    FILTERS: {
      TITLE: 'Filters',
      ADMIN: 'Groups I am admin',
      USER: 'Groups I am user',
      HELP: 'You can select one or several filters, click again on it to deactivate'
    },
    TAGS: {
      TITLE: 'Tags',
      HELP: 'You can filter by one or more tags. Click again to deactivate if wanted'
    },
    PAD: {
      TITLE: 'Title',
      ADMINS: 'Admins',
      USERS: 'Users',
      USERS_NONE: 'No user',
      VISIBILITY: 'Visibility',
      PADS: 'Pads',
      NONE: 'No pad linked',
      ADD: 'Create a new pad',
      ADD_PROMPT: 'Enter the name of the new pad',
      EDIT_PROMPT: 'Enter the new name of the pad'
    },
    INFO: {
      NAME: 'Name of the group',
      VISIBILITY: 'Required, restricted by default to invited users or admins',
      READONLY: 'If checked, linked pads will be in readonly mode',
      PASSWORD: 'Required in private mode',
      ADD_SUCCESS: 'Group has been successfully created',
      EDIT_SUCCESS: 'Group has been successfully updated',
      REMOVE_SUCCESS: 'Group has been successfully removed',
      REMOVE_SURE: 'Are you sure you want to remove this group ?',
      PAD_REMOVE_SUCCESS: 'Pad has been successfully removed',
      PAD_REMOVE_SURE: 'Are you sure you want to remove this pad ?',
      PAD_ADD_SUCCESS: 'Pad has been successfully created',
      PAD_EDIT_SUCCESS: 'Pad has been successfully updated'
    },
    ERR: {
      NAME: 'The name of the group is required'
    }
  }
};
